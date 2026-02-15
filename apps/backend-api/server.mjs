import http from "http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join, normalize, dirname } from "path";
import { execSync } from "child_process";
import { applyOpsToDir } from "../../platform/runtime/changes/patch-engine.mjs";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";
import { emitEvent } from "../../platform/runtime/events/bus.mjs";
import { resolveSecret } from "../../platform/runtime/integrations/dispatcher.mjs";
import { getEffectiveQosOverrides } from "../../platform/runtime/ops/actions.mjs";
import { createIncident, readIncident, executeRunbook, listTimeline } from "../../platform/runtime/ops/engine.mjs";
import { planTenantCreate, planTenantClone, dryRunCreate, applyCreate, readFactoryStatus } from "../../platform/runtime/tenancy/factory.mjs";
import { analyzeInstall } from "../../platform/runtime/marketplace/impact.mjs";
import { sha256, stableStringify } from "../../platform/compilers/utils.mjs";
import { createHmac, timingSafeEqual } from "crypto";

const PORT = process.env.PORT || 7070;
const ROOT = process.cwd();
const SSOT_DIR = process.env.SSOT_DIR ? normalize(process.env.SSOT_DIR) : normalize(join(ROOT, "platform/ssot"));
const RUNTIME_DIR = process.env.RUNTIME_DIR ? normalize(process.env.RUNTIME_DIR) : normalize(join(dirname(SSOT_DIR), "runtime"));
const ssotPath = (p) => join(SSOT_DIR, p);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function json(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function bodyToJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function bodyToText(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

function ensureChangeset(id) {
  const csPath = ssotPath(`changes/changesets/${id}.json`);
  if (!existsSync(csPath)) throw new Error("Changeset not found");
  const cs = readJson(csPath);
  if (cs.status !== "draft") throw new Error("Changeset not in draft state");
  return cs;
}

function appendAudit(entry) {
  const path = ssotPath("governance/audit_ledger.json");
  const ledger = existsSync(path) ? readJson(path) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeJson(path, ledger);
}

function scopeMatches(pattern, scope) {
  if (pattern === scope) return true;
  if (pattern.endsWith(":*")) return scope.startsWith(pattern.slice(0, -1));
  if (pattern === "platform:*" && scope.startsWith("platform:")) return true;
  if (pattern === "tenant:*" && scope.startsWith("tenant:")) return true;
  return false;
}

function getGovernanceData() {
  return {
    users: readJson(ssotPath("governance/users.json")),
    memberships: readJson(ssotPath("governance/org_memberships.json")),
    roles: readJson(ssotPath("governance/roles.json")),
    permissions: readJson(ssotPath("governance/permissions.json")),
    permissionSets: readJson(ssotPath("governance/permission_sets.json")),
    policies: readJson(ssotPath("governance/policies.json")),
    bindings: readJson(ssotPath("governance/policy_bindings.json")),
    breakGlass: readJson(ssotPath("governance/break_glass.json")),
    changeFreeze: readJson(ssotPath("governance/change_freeze.json"))
  };
}

function readModules() {
  const modules = readJson(ssotPath("modules/domain_modules.json"));
  const versions = readJson(ssotPath("modules/domain_module_versions.json"));
  const activations = readJson(ssotPath("modules/module_activations.json"));
  const byModule = new Map();
  for (const v of versions) {
    const key = v.module_id;
    const list = byModule.get(key) || [];
    list.push(v);
    byModule.set(key, list);
  }
  return modules.map((m) => {
    const vlist = (byModule.get(m.module_id) || []).sort((a, b) => (a.version || "").localeCompare(b.version || ""));
    const latest = vlist[vlist.length - 1] || null;
    const activeTenants = activations.filter((a) => a.module_id === m.module_id && a.state === "active").length;
    return { ...m, latest_version: latest?.version || "", active_tenants: activeTenants };
  });
}

function readMarketplaceCatalog() {
  const active = readActiveRelease();
  if (!active.active_release_id) return [];
  try {
    const manifest = loadManifest({ releaseId: active.active_release_id, manifestsDir: process.env.MANIFESTS_DIR || "./runtime/manifests", stalenessMs: 0 });
    return manifest.marketplace?.catalog || [];
  } catch {
    return [];
  }
}

function getFinopsData() {
  return {
    plans: readJson(ssotPath("tenancy/plans.json")),
    planVersions: readJson(ssotPath("tenancy/plan_versions.json")),
    tenantOverrides: readJson(ssotPath("tenancy/tenant_overrides.json")),
    tenantQuotas: readJson(ssotPath("tenancy/tenant_quotas.json")),
    tenants: readJson(ssotPath("tenancy/tenants.json")),
    budgets: readJson(ssotPath("finops/budgets.json"))
  };
}

function parseSemver(v) {
  const [maj, min, pat] = String(v || "0.0.0").split(".").map((n) => Number(n));
  return { maj: maj || 0, min: min || 0, pat: pat || 0 };
}

function semverGte(a, b) {
  if (a.maj !== b.maj) return a.maj > b.maj;
  if (a.min !== b.min) return a.min > b.min;
  return a.pat >= b.pat;
}

function pickPlanId(tenantId, finops) {
  const override = (finops.tenantOverrides || []).find((o) => o.tenant_id === tenantId);
  if (override?.plan_id) return override.plan_id;
  const tenant = (finops.tenants || []).find((t) => t.tenant_id === tenantId);
  if (tenant?.plan_id) return tenant.plan_id;
  const def = (finops.plans || []).find((p) => p.is_default);
  return def?.plan_id || (finops.plans[0]?.plan_id || "");
}

function pickPlanVersion(planId, finops) {
  const versions = (finops.planVersions || []).filter((v) => v.plan_id === planId);
  if (versions.length === 0) return null;
  const now = Date.now();
  let candidate = null;
  for (const v of versions) {
    const eff = Date.parse(v.effective_from || "");
    if (!Number.isFinite(eff) || eff > now) continue;
    if (!candidate || semverGte(parseSemver(v.version), parseSemver(candidate.version))) candidate = v;
  }
  return candidate || versions[0];
}

function getPlanVersionForTenant(tenantId, finops) {
  const planId = pickPlanId(tenantId, finops);
  const pv = pickPlanVersion(planId, finops);
  return { plan_id: planId, plan_version: pv };
}

function effectiveQuotas(tenantId, finops) {
  const { plan_id, plan_version } = getPlanVersionForTenant(tenantId, finops);
  const pv = plan_version || {};
  const override = (finops.tenantQuotas || []).find((q) => q.tenant_id === tenantId);
  const quotas = {
    requests_per_day: (pv.rate_limits?.rps || 0) * 86400,
    cpu_ms_per_day: pv.compute_budgets?.cpu_ms_per_day || 0,
    cost_units_per_day: pv.budgets?.cost_units_per_day || 0,
    concurrent_ops: pv.rate_limits?.concurrent_ops || 0,
    burst: pv.rate_limits?.burst || 0,
    ...(override?.quotas || {})
  };
  return { plan_id, plan_version: pv?.version || "", quotas, perf_tier: pv?.perf_tier || "free", priority_weight: pv?.priority_weight || 1 };
}

function getTenantPlanDetails(tenantId) {
  const finops = getFinopsData();
  const planId = pickPlanId(tenantId, finops);
  const plan = (finops.plans || []).find((p) => p.plan_id === planId) || null;
  const planVersion = pickPlanVersion(planId, finops);
  const quotas = effectiveQuotas(tenantId, finops).quotas;
  return { plan, plan_version: planVersion, quotas };
}

function listUsage(tenantId, range) {
  const safe = tenantId.replace(/[^a-z0-9-_]/gi, "_");
  const dir = join("./platform/runtime/finops/usage", safe);
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (!range) return files.map((f) => readJson(join(dir, f)));
  if (range.includes("-")) {
    const [start, end] = range.split("-");
    return files
      .filter((f) => f.replace(".json", "") >= start && f.replace(".json", "") <= end)
      .map((f) => readJson(join(dir, f)));
  }
  const single = join(dir, `${range}.json`);
  if (!existsSync(single)) return [];
  return [readJson(single)];
}

function usagePath(tenantId, dateKey) {
  const safe = tenantId.replace(/[^a-z0-9-_]/gi, "_");
  return join(RUNTIME_DIR, "finops", "usage", safe, `${dateKey}.json`);
}

function readUsage(tenantId, dateKey) {
  const path = usagePath(tenantId, dateKey);
  if (existsSync(path)) return readJson(path);
  return {
    tenant_id: tenantId,
    date: dateKey,
    requests_per_day: 0,
    cpu_ms_per_day: 0,
    cost_units_per_day: 0,
    storage_mb: 0,
    ocr_pages_per_month: 0
  };
}

function writeUsage(tenantId, dateKey, usage) {
  const path = usagePath(tenantId, dateKey);
  mkdirSync(dirname(path), { recursive: true });
  writeJson(path, usage);
}

function dataIndexPath(tenantId, modelId) {
  const safeTenant = tenantId.replace(/[^a-z0-9-_]/gi, "_");
  const safeModel = modelId.replace(/[^a-z0-9-_]/gi, "_");
  return join(RUNTIME_DIR, "datagov", "records_index", safeTenant, `${safeModel}.jsonl`);
}

function appendDataIndex(tenantId, modelId, record) {
  const path = dataIndexPath(tenantId, modelId);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(record) + "\n", { flag: "a" });
}

function readDataCatalog(manifest) {
  return manifest?.data_catalog || {};
}

function classifyField(catalog, fieldId) {
  const field = (catalog.data_fields || []).find((f) => f.field_id === fieldId);
  return field?.classification_id || "internal";
}

function maskingRequired(manifest, exportType) {
  const controls = manifest?.export_controls || [];
  const ctrl = controls.find((c) => c.export_type === exportType);
  return ctrl?.masking_required || false;
}

function exportControl(manifest, exportType) {
  const controls = manifest?.export_controls || [];
  return controls.find((c) => c.export_type === exportType) || null;
}

function hasLegalHold(manifest, modelId) {
  const policies = manifest?.retention_policies || [];
  return policies.some((p) => p.target_model_id === modelId && p.legal_hold === true);
}

function checkBudgets({ tenantId, usage, finops }) {
  const budgets = finops.budgets || [];
  const scope = `tenant:${tenantId}`;
  for (const b of budgets) {
    if (!scopeMatches(b.scope, scope)) continue;
    const metric = b.metric;
    const current = usage[metric] || 0;
    const limit = b.limit || 0;
    const threshold = limit * (b.alert_percent || 0);
    if (limit > 0 && current >= threshold) {
      appendAudit({ event: "budget_alert", tenant_id: tenantId, metric, current, limit, at: new Date().toISOString() });
      const manifest = loadActiveManifest();
      if (manifest) {
        emitEvent({ manifest, tenantId, event: "on_budget_threshold", payload: { metric, current, limit }, qosEnforcer: createQosTicket }).catch(() => {});
      }
    }
  }
}

function quotaExceededError(message, statusCode = 429) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const ACTION_COSTS = {
  "api.read": 1,
  "api.write": 3,
  "ocr.page": 5,
  "workflow.step": 1,
  "manifest.load": 1,
  "integration.webhook.in": 2,
  "integration.webhook.out": 2
};

function qosCounterPath(tenantId, dateKey) {
  const safe = tenantId.replace(/[^a-z0-9-_]/gi, "_");
  return join(RUNTIME_DIR, "qos", "counters", safe, `${dateKey}.json`);
}

function readQosCounters(tenantId, dateKey) {
  const path = qosCounterPath(tenantId, dateKey);
  if (existsSync(path)) return readJson(path);
  return {
    tenant_id: tenantId,
    date: dateKey,
    workloads: {
      api: { total: 0, errors: 0, last_latency_ms: 0, breaker_open_until: 0 },
      ocr: { total: 0, errors: 0, last_latency_ms: 0, breaker_open_until: 0 },
      workflow: { total: 0, errors: 0, last_latency_ms: 0, breaker_open_until: 0 },
      webhook: { total: 0, errors: 0, last_latency_ms: 0, breaker_open_until: 0 },
      egress: { total: 0, errors: 0, last_latency_ms: 0, breaker_open_until: 0 }
    }
  };
}

function writeQosCounters(tenantId, dateKey, data) {
  const path = qosCounterPath(tenantId, dateKey);
  mkdirSync(dirname(path), { recursive: true });
  writeJson(path, data);
}

const tokenBuckets = new Map();
const concurrencyMap = new Map();

function tokenBucketAllow(key, rate, burst) {
  const now = Date.now();
  const state = tokenBuckets.get(key) || { tokens: burst, last: now };
  const refill = ((now - state.last) / 1000) * rate;
  state.tokens = Math.min(burst, state.tokens + refill);
  state.last = now;
  if (state.tokens < 1) {
    tokenBuckets.set(key, state);
    return false;
  }
  state.tokens -= 1;
  tokenBuckets.set(key, state);
  return true;
}

function getQosPolicyForTier(tier) {
  try {
    const policies = readJson(ssotPath("qos/qos_policies.json"));
    return policies.find((p) => p.tier === tier) || null;
  } catch {
    return null;
  }
}

function qosEnforcer({ tenantId, actionType, workload, costHint }) {
  const finops = getFinopsData();
  const { plan_version, plan_id } = getPlanVersionForTenant(tenantId, finops);
  const pv = plan_version || {};
  const tier = pv.perf_tier || "free";
  const policy = getQosPolicyForTier(tier) || {};
  const rate = pv.rate_limits?.rps || 0;
  const burst = pv.rate_limits?.burst || 0;
  const concurrencyLimit = pv.rate_limits?.concurrent_ops || 0;
  const priority = pv.priority_weight || 1;
  const p95Target = pv.compute_budgets?.p95_latency_target_ms || 0;
  const cpuBudget = pv.compute_budgets?.cpu_ms_per_day || 0;
  const costBudget = pv.budgets?.cost_units_per_day || 0;

  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const counters = readQosCounters(tenantId, dateKey);
  const wl = counters.workloads[workload] || counters.workloads.api;
  const now = Date.now();
  if (wl.breaker_open_until && wl.breaker_open_until > now) {
    throw quotaExceededError("Circuit breaker open", 503);
  }

  const queueDepth = concurrencyMap.get(`${tenantId}:${workload}`) || 0;
  const maxQueue = policy.max_queue_depth?.[workload] ?? 0;
  if (maxQueue > 0 && queueDepth >= maxQueue && priority <= 20) {
    throw quotaExceededError("Queue depth exceeded", 429);
  }

  let effectiveRate = rate;
  let effectiveConcurrency = concurrencyLimit;
  if (p95Target > 0 && wl.last_latency_ms > p95Target && priority <= 50) {
    effectiveRate = Math.max(1, Math.floor(rate * 0.5));
  }

  const overrides = getEffectiveQosOverrides({ tenantId, tier, workload });
  for (const o of overrides) {
    if (o.type === "throttle") {
      const factor = Number(o.factor || 1);
      effectiveRate = Math.max(1, Math.floor(effectiveRate * factor));
      if (effectiveConcurrency > 0) effectiveConcurrency = Math.max(1, Math.floor(effectiveConcurrency * factor));
    }
    if (o.type === "shed") {
      const mode = o.mode || "deny";
      const rateDrop = Math.max(0, Math.min(1, Number(o.rate || 1)));
      if (mode === "deny") throw quotaExceededError("Load shedding active", 503);
      if (mode === "probabilistic" && Math.random() < rateDrop) throw quotaExceededError("Load shedding active", 503);
    }
  }

  if (!tokenBucketAllow(`${tenantId}:${workload}`, effectiveRate, burst)) {
    throw quotaExceededError("Rate limit exceeded", 429);
  }

  if (effectiveConcurrency > 0 && queueDepth >= effectiveConcurrency) {
    throw quotaExceededError("Concurrency limit exceeded", 429);
  }
  concurrencyMap.set(`${tenantId}:${workload}`, queueDepth + 1);

  const usage = readUsage(tenantId, dateKey);
  if (usage.requests_per_day >= ((rate || 1) * 86400)) {
    throw quotaExceededError("Quota exceeded: requests_per_day", 429);
  }
  if (cpuBudget > 0 && usage.cpu_ms_per_day >= cpuBudget) {
    throw quotaExceededError("Quota exceeded: cpu_ms_per_day", 429);
  }
  if (costBudget > 0 && usage.cost_units_per_day >= costBudget) {
    throw quotaExceededError("Quota exceeded: cost_units_per_day", 429);
  }

  usage.requests_per_day += 1;
  usage.cost_units_per_day += costHint;
  writeUsage(tenantId, dateKey, usage);
  checkBudgets({ tenantId, usage, finops });

  return {
    tenantId,
    plan_id,
    tier,
    workload,
    dateKey,
    startAt: Date.now(),
    policy,
    costHint
  };
}

function finalizeQos(ctx, statusCode, elapsedMs) {
  const usage = readUsage(ctx.tenantId, ctx.dateKey);
  usage.cpu_ms_per_day += Math.max(0, elapsedMs);
  writeUsage(ctx.tenantId, ctx.dateKey, usage);

  const counters = readQosCounters(ctx.tenantId, ctx.dateKey);
  const wl = counters.workloads[ctx.workload] || counters.workloads.api;
  wl.total += 1;
  if (statusCode >= 500) wl.errors += 1;
  wl.last_latency_ms = elapsedMs;
  const errRate = wl.total ? wl.errors / wl.total : 0;
  const threshold = ctx.policy?.shed_on_error_rate_over ?? 1;
  if (wl.total >= 20 && errRate >= threshold) {
    const cooldown = ctx.policy?.grace_windows?.breaker_cooldown_s ?? 60;
    wl.breaker_open_until = Date.now() + cooldown * 1000;
    const manifest = loadActiveManifest();
    if (manifest) {
      emitEvent({ manifest, tenantId: ctx.tenantId, event: "on_qos_incident", payload: { workload: ctx.workload, errRate }, qosEnforcer: createQosTicket }).catch(() => {});
    }
  }
  counters.workloads[ctx.workload] = wl;
  writeQosCounters(ctx.tenantId, ctx.dateKey, counters);
  const current = concurrencyMap.get(`${ctx.tenantId}:${ctx.workload}`) || 1;
  concurrencyMap.set(`${ctx.tenantId}:${ctx.workload}`, Math.max(0, current - 1));
}

function createQosTicket({ tenantId, actionType, workload, costHint }) {
  const ctx = qosEnforcer({ tenantId, actionType, workload, costHint });
  return {
    ctx,
    finish: (statusCode, elapsedMs) => finalizeQos(ctx, statusCode, elapsedMs)
  };
}

function getUserRoles(userId, memberships) {
  return memberships.filter((m) => m.user_id === userId).map((m) => m.role_id);
}

function hasPermission(roleIds, permissionSets, action) {
  const allowed = new Set();
  for (const ps of permissionSets) {
    if (!roleIds.includes(ps.role_id)) continue;
    for (const p of ps.permission_ids || []) allowed.add(p);
  }
  return allowed.has(action);
}

function policyAllows({ action, scope, resource, roles, policies, bindings }) {
  const bound = bindings.filter((b) => roles.includes(b.role_id) && scopeMatches(b.scope, scope));
  const policyIds = new Set(bound.map((b) => b.policy_id));
  for (const p of policies.filter((p) => policyIds.has(p.id))) {
    if (!p.actions?.includes(action)) continue;
    const scopes = p.scopes || [];
    if (scopes.length && !scopes.some((s) => scopeMatches(s, scope))) continue;
    const c = p.conditions || {};
    if (c.surface && resource.surface && c.surface !== resource.surface) continue;
    if (c.env && resource.env && c.env !== resource.env) continue;
    return true;
  }
  return false;
}

function breakGlassAllows({ breakGlass, action, scope }) {
  if (!breakGlass?.enabled) return false;
  if (!breakGlass.expires_at) return false;
  const now = Date.now();
  const exp = Date.parse(breakGlass.expires_at);
  if (!Number.isFinite(exp) || exp <= now) return false;
  if (!breakGlass.allowed_actions?.includes(action)) return false;
  if (!scopeMatches(breakGlass.scope, scope)) return false;
  return true;
}

function actionMatches(pattern, action) {
  const normalize = (s) => String(s || "").replace(/_/g, "");
  const p = String(pattern || "");
  if (p.endsWith(".*")) return normalize(action).startsWith(normalize(p.slice(0, -1)));
  return normalize(action) === normalize(p);
}

function freezeAllows({ changeFreeze, action }) {
  if (!changeFreeze?.enabled) return true;
  const allow = changeFreeze.allow_actions || [];
  if (allow.some((p) => actionMatches(p, action))) return true;
  const scopes = changeFreeze.scopes || {};
  const isStudioUi = action.startsWith("studio.modules");
  const isContent =
    action.startsWith("studio.pages") ||
    action.startsWith("studio.routes") ||
    action.startsWith("studio.nav") ||
    action.startsWith("studio.widgets") ||
    action.startsWith("studio.forms") ||
    action.startsWith("studio.workflows") ||
    action.startsWith("design.tokens") ||
    action.startsWith("design.themes");

  if (scopes.studio_ui_mutations === true && isStudioUi) return false;
  if (scopes.content_mutations === true && isContent) return false;
  return true;
}

function expireBreakGlassIfNeeded(breakGlass) {
  if (!breakGlass?.enabled || !breakGlass.expires_at) return;
  const exp = Date.parse(breakGlass.expires_at);
  if (Number.isFinite(exp) && exp <= Date.now()) {
    const updated = { ...breakGlass, enabled: false };
    writeJson(ssotPath("governance/break_glass.json"), updated);
    appendAudit({ event: "break_glass_expired", at: new Date().toISOString() });
  }
}

function reviewFilename(action, targetId) {
  const safe = action.replace(/[^a-z0-9-]/gi, "_");
  return ssotPath(`changes/reviews/${safe}-${targetId}.json`);
}

function requireQuorum(action, targetId, required = 2) {
  const path = reviewFilename(action, targetId);
  if (!existsSync(path)) throw new Error("Quorum not met");
  const review = readJson(path);
  const approvals = review.approvals || [];
  if ((review.required_approvals || required) > approvals.length) throw new Error("Quorum not met");
  if (review.status !== "approved") throw new Error("Quorum not met");
}

function authorizeOrDeny(req, action, resource = {}) {
  const userId = req.headers["x-user-id"] || "user:admin";
  const tenantId = req.headers["x-tenant-id"];
  const scope = req.headers["x-scope"] || (tenantId ? `tenant:${tenantId}:*` : "platform:*");
  const gov = getGovernanceData();
  if (!freezeAllows({ changeFreeze: gov.changeFreeze, action })) {
    appendAudit({ event: "freeze_denied", action, scope, user_id: userId, at: new Date().toISOString() });
    throw new Error("Forbidden");
  }
  expireBreakGlassIfNeeded(gov.breakGlass);
  const roles = getUserRoles(userId, gov.memberships);

  const allowed =
    breakGlassAllows({ breakGlass: gov.breakGlass, action, scope }) ||
    (hasPermission(roles, gov.permissionSets, action) && policyAllows({ action, scope, resource, roles, policies: gov.policies, bindings: gov.bindings }));

  appendAudit({ event: "authz_decision", action, scope, user_id: userId, decision: allowed ? "allow" : "deny", at: new Date().toISOString() });
  if (!allowed) throw new Error("Forbidden");
}

function requireAdmin(_req) {
  return true;
}

function requirePermission(req, perm) {
  authorizeOrDeny(req, perm, { surface: "cp" });
}

function authorizeAction(req, action, scope, resource = {}) {
  const headers = { ...req.headers, "x-scope": scope };
  authorizeOrDeny({ headers }, action, resource);
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (s.includes("/changes/snapshots") || s.includes("/changes/changesets") || s.includes("/changes/releases")) continue;
    if (entry.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

function latestReleaseId() {
  const dir = ssotPath("changes/releases");
  if (!existsSync(dir)) return "";
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (!files.length) return "";
  const latest = files
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0].f;
  return latest.replace(".json", "");
}

function readActiveRelease() {
  const path = ssotPath("changes/active_release.json");
  if (!existsSync(path)) return { active_release_id: "", active_env: "dev" };
  const data = readJson(path);
  return {
    active_release_id: data.active_release_id || "",
    active_env: data.active_env || "dev"
  };
}

function normalizeTier(tier) {
  if (tier === "enterprise") return "ent";
  return tier || "free";
}

function tierRank(tier) {
  const t = normalizeTier(tier);
  if (t === "ent") return 3;
  if (t === "pro") return 2;
  return 1;
}

function getTenantPlan(tenantId) {
  const tenants = readJson(ssotPath("tenancy/tenants.json"));
  const overrides = readJson(ssotPath("tenancy/tenant_overrides.json"));
  const plans = readJson(ssotPath("tenancy/plans.json"));
  const versions = readJson(ssotPath("tenancy/plan_versions.json"));
  const override = overrides.find((o) => o.tenant_id === tenantId);
  const tenant = tenants.find((t) => t.tenant_id === tenantId);
  const planId = override?.plan_id || tenant?.plan_id || "plan:free";
  const plan = plans.find((p) => p.plan_id === planId);
  const planVersions = versions.filter((v) => v.plan_id === planId);
  const version = planVersions.length ? planVersions[planVersions.length - 1] : null;
  return { plan_id: planId, tier: normalizeTier(version?.perf_tier || plan?.tier || "free") };
}

function buildPreviewFromOps(changesetId, ops) {
  const previewDir = `./platform/runtime/preview/${changesetId}`;
  const previewSsot = join(previewDir, "ssot");
  const previewManifests = join(previewDir, "manifests");
  mkdirSync(previewSsot, { recursive: true });
  mkdirSync(previewManifests, { recursive: true });
  copyDir(SSOT_DIR, previewSsot);
  applyOpsToDir(previewSsot, ops);
  execSync(`node scripts/ci/compile.mjs preview-${changesetId} dev`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: previewSsot, OUT_DIR: previewManifests }
  });
  execSync(`node governance/gates/run-gates.mjs preview-${changesetId}`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: previewSsot, MANIFESTS_DIR: previewManifests }
  });
  return { previewSsot, previewManifests, previewReleaseId: `preview-${changesetId}` };
}

function loadActiveManifest() {
  const active = readActiveRelease();
  if (!active.active_release_id) return null;
  try {
    const manifestsDir = process.env.MANIFESTS_DIR || "./runtime/manifests";
    return loadManifest({ releaseId: active.active_release_id, manifestsDir });
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url?.startsWith("/api/")) requireAdmin(req);
    const tenantHeader = req.headers["x-tenant-id"];
    const tenantId = typeof tenantHeader === "string" && tenantHeader ? tenantHeader : null;
    const actionOverride = req.headers["x-action-type"];
    const inferredAction = req.url?.includes("/api/integrations/webhook/in") ? "integration.webhook.in" : (req.method === "GET" ? "api.read" : "api.write");
    const actionType = typeof actionOverride === "string" && actionOverride ? actionOverride : inferredAction;
    const workload = req.url?.includes("/api/integrations/webhook") ? "webhook" : req.url?.includes("/ocr") ? "ocr" : req.url?.includes("/workflow") ? "workflow" : "api";
    const costHint = ACTION_COSTS[actionType] ?? 1;
    const qosTicket = tenantId ? createQosTicket({ tenantId, actionType, workload, costHint }) : null;
    if (qosTicket) {
      res.on("finish", () => {
        const elapsed = Date.now() - qosTicket.ctx.startAt;
        qosTicket.finish(res.statusCode, elapsed);
      });
    }
    const sleepMs = Number(req.headers["x-qos-sleep-ms"] || 0);
    if (Number.isFinite(sleepMs) && sleepMs > 0) {
      await new Promise((r) => setTimeout(r, sleepMs));
    }

    if (req.method === "POST" && req.url === "/api/changesets") {
      requirePermission(req, "studio.pages.edit");
      const id = `cs-${Date.now()}`;
      mkdirSync(ssotPath("changes/changesets"), { recursive: true });
      const cs = { id, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] };
      writeJson(ssotPath(`changes/changesets/${id}.json`), cs);
      appendAudit({ event: "changeset_created", changeset_id: id, at: cs.created_at });
      return json(res, 201, cs);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/changesets/")) {
      requirePermission(req, "studio.pages.view");
      const id = req.url.split("/")[3];
      const csPath = ssotPath(`changes/changesets/${id}.json`);
      return json(res, 200, readJson(csPath));
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/ops")) {
      requirePermission(req, "studio.pages.edit");
      const id = req.url.split("/")[3];
      const csPath = ssotPath(`changes/changesets/${id}.json`);
      const cs = ensureChangeset(id);
      const payload = await bodyToJson(req);
      cs.ops.push(payload);
      writeJson(csPath, cs);
      appendAudit({ event: "changeset_op_added", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, cs);
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/preview")) {
      requirePermission(req, "studio.pages.edit");
      const id = req.url.split("/")[3];
      const cs = ensureChangeset(id);
      const previewDir = `./platform/runtime/preview/${id}`;
      const previewSsot = join(previewDir, "ssot");
      const previewManifests = join(previewDir, "manifests");
      mkdirSync(previewSsot, { recursive: true });
      mkdirSync(previewManifests, { recursive: true });
      copyDir(SSOT_DIR, previewSsot);
      applyOpsToDir(previewSsot, cs.ops);
      execSync(`node scripts/ci/compile.mjs preview-${id} dev`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, OUT_DIR: previewManifests }
      });
      appendAudit({ event: "changeset_preview", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, { preview_release: `preview-${id}` });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/validate")) {
      requirePermission(req, "studio.pages.edit");
      const id = req.url.split("/")[3];
      execSync(`node governance/gates/run-gates.mjs preview-${id}`, {
        stdio: "inherit",
        env: {
          ...process.env,
          SSOT_DIR: `./platform/runtime/preview/${id}/ssot`,
          MANIFESTS_DIR: `./platform/runtime/preview/${id}/manifests`
        }
      });
      appendAudit({ event: "changeset_validate", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/publish")) {
      requirePermission(req, "studio.releases.publish");
      const id = req.url.split("/")[3];
      requireQuorum("publish", id, 2);
      execSync(`node scripts/ci/release.mjs --from-changeset ${id} --env dev --strategy canary`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR }
      });
      appendAudit({ event: "changeset_publish", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, { ok: true, release_id: latestReleaseId() });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/runtime/manifest")) {
      const url = new URL(req.url, "http://localhost");
      const releaseId = url.searchParams.get("release") || readActiveRelease().active_release_id || latestReleaseId();
      const previewId = url.searchParams.get("preview");
      if (!releaseId) return json(res, 404, { error: "No release available" });
      const manifestsDir = previewId ? `./platform/runtime/preview/${previewId}/manifests` : (process.env.MANIFESTS_DIR || "./runtime/manifests");
      const manifest = loadManifest({ releaseId, stalenessMs: 0, manifestsDir });
      return json(res, 200, manifest);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/runtime/active-release")) {
      return json(res, 200, readActiveRelease());
    }

    if (req.method === "POST" && req.url?.startsWith("/api/integrations/webhook/in/")) {
      const connectorId = decodeURIComponent(req.url.split("/")[5] || "");
      if (!tenantId) return json(res, 400, { error: "Missing x-tenant-id" });
      const manifest = loadActiveManifest();
      if (!manifest) return json(res, 503, { error: "Manifest not available" });
      const webhook = (manifest.integrations?.webhooks || []).find(
        (w) => w.connector_id === connectorId && w.direction === "inbound" && w.tenant_id === tenantId
      );
      if (!webhook) return json(res, 404, { error: "Webhook not registered" });
      const raw = await bodyToText(req);
      if (webhook.signature_required) {
        const headerName = (webhook.signature_header || "x-signature").toLowerCase();
        const sig = req.headers[headerName];
        if (!sig) {
          appendAudit({ event: "webhook_in_reject", tenant_id: tenantId, connector_id: connectorId, reason: "missing_signature", at: new Date().toISOString() });
          return json(res, 401, { error: "Missing signature" });
        }
        const secret = resolveSecret(webhook.secret_ref_id, manifest, tenantId);
        const computed = createHmac("sha256", secret).update(raw).digest("hex");
        const sigStr = Array.isArray(sig) ? sig[0] : sig;
        const ok = sigStr.length === computed.length && timingSafeEqual(Buffer.from(sigStr), Buffer.from(computed));
        if (!ok) {
          appendAudit({ event: "webhook_in_reject", tenant_id: tenantId, connector_id: connectorId, reason: "invalid_signature", at: new Date().toISOString() });
          return json(res, 401, { error: "Invalid signature" });
        }
      }
      authorizeOrDeny(req, "integrations.webhook.in", { connector_id: connectorId });
      appendAudit({ event: "webhook_in_received", tenant_id: tenantId, connector_id: connectorId, at: new Date().toISOString() });
      let payload = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        payload = { raw };
      }
      emitEvent({ manifest, tenantId, event: "integration.webhook_received", payload, qosEnforcer: createQosTicket }).catch(() => {});
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/studio/pages") {
      requirePermission(req, "studio.pages.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, page_definition, page_version } = payload;
      ensureChangeset(changeset_id);
      const ops = [
        { op: "add", target: { kind: "page_definition", ref: page_definition.id }, value: page_definition, preconditions: { expected_exists: false } },
        { op: "add", target: { kind: "page_version", ref: page_version.page_id }, value: page_version, preconditions: { expected_exists: false } }
      ];
      for (const op of ops) {
        const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
        cs.ops.push(op);
        writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      }
      appendAudit({ event: "studio_page_create", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && req.url === "/api/studio/modules") {
      requirePermission(req, "studio.modules.view");
      return json(res, 200, readModules());
    }

    if (req.method === "GET" && req.url?.startsWith("/api/studio/modules/") && req.url.split("/").length === 4) {
      requirePermission(req, "studio.modules.view");
      const id = req.url.split("/")[3];
      const modules = readJson(ssotPath("modules/domain_modules.json"));
      const versions = readJson(ssotPath("modules/domain_module_versions.json"));
      const activations = readJson(ssotPath("modules/module_activations.json"));
      const mod = modules.find((m) => m.module_id === id);
      if (!mod) return json(res, 404, { error: "Module not found" });
      const modVersions = versions.filter((v) => v.module_id === id);
      const modActivations = activations.filter((a) => a.module_id === id);
      return json(res, 200, { module: mod, versions: modVersions, activations: modActivations });
    }

    if (req.method === "POST" && req.url === "/api/studio/modules") {
      requirePermission(req, "studio.modules.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, module, module_version } = payload;
      ensureChangeset(changeset_id);
      if (!module?.module_id) throw new Error("Missing module_id");
      const version = module_version || { module_id: module.module_id, version: "1.0.0", status: "active" };
      const ops = [
        { op: "add", target: { kind: "domain_module", ref: module.module_id }, value: module, preconditions: { expected_exists: false } },
        { op: "add", target: { kind: "domain_module_version", ref: `${version.module_id}@${version.version}` }, value: version, preconditions: { expected_exists: false } }
      ];
      for (const op of ops) {
        const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
        cs.ops.push(op);
        writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      }
      appendAudit({ event: "studio_module_create", module_id: module.module_id, changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH" && req.url?.startsWith("/api/studio/modules/") && req.url.split("/").length === 4) {
      requirePermission(req, "studio.modules.edit");
      const moduleId = req.url.split("/")[3];
      const payload = await bodyToJson(req);
      const { changeset_id, value } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "update", target: { kind: "domain_module", ref: moduleId }, value, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_module_update", module_id: moduleId, changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/studio/modules/") && req.url?.endsWith("/publish")) {
      requirePermission(req, "studio.modules.publish");
      const moduleId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id } = payload;
      requireQuorum("publish", changeset_id, 2);
      const cs = ensureChangeset(changeset_id);
      const previewDir = `./platform/runtime/preview/${changeset_id}`;
      const previewSsot = join(previewDir, "ssot");
      const previewManifests = join(previewDir, "manifests");
      mkdirSync(previewSsot, { recursive: true });
      mkdirSync(previewManifests, { recursive: true });
      copyDir(SSOT_DIR, previewSsot);
      applyOpsToDir(previewSsot, cs.ops);
      execSync(`node scripts/ci/compile.mjs preview-${changeset_id} dev`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, OUT_DIR: previewManifests }
      });
      execSync(`node governance/gates/run-gates.mjs preview-${changeset_id}`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, MANIFESTS_DIR: previewManifests }
      });
      execSync(`node scripts/ci/release.mjs --from-changeset ${changeset_id} --env dev --strategy canary`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR }
      });
      appendAudit({ event: "studio_module_publish", module_id: moduleId, changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true, release_id: latestReleaseId() });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/studio/modules/") && req.url?.endsWith("/activate")) {
      requirePermission(req, "studio.modules.activate");
      const moduleId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const tenantId = payload.tenant_id || "tenant:default";
      const changesetId = payload.changeset_id || `cs-activate-module-${Date.now()}`;
      requireQuorum("activate", changesetId, 2);
      const csPath = ssotPath(`changes/changesets/${changesetId}.json`);
      if (!existsSync(csPath)) {
        mkdirSync(ssotPath("changes/changesets"), { recursive: true });
        writeJson(csPath, { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] });
      }
      const activations = readJson(ssotPath("modules/module_activations.json"));
      const key = `${tenantId}:${moduleId}`;
      const exists = activations.some((a) => `${a.tenant_id}:${a.module_id}` === key);
      const op = exists
        ? { op: "update", target: { kind: "module_activation", ref: key }, value: { state: "active" }, preconditions: { expected_exists: true } }
        : { op: "add", target: { kind: "module_activation", ref: key }, value: { tenant_id: tenantId, module_id: moduleId, state: "active" }, preconditions: { expected_exists: false } };
      const cs = readJson(csPath);
      cs.ops.push(op);
      writeJson(csPath, cs);
      const previewDir = `./platform/runtime/preview/${changesetId}`;
      const previewSsot = join(previewDir, "ssot");
      const previewManifests = join(previewDir, "manifests");
      mkdirSync(previewSsot, { recursive: true });
      mkdirSync(previewManifests, { recursive: true });
      copyDir(SSOT_DIR, previewSsot);
      applyOpsToDir(previewSsot, cs.ops);
      execSync(`node scripts/ci/compile.mjs preview-${changesetId} dev`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, OUT_DIR: previewManifests }
      });
      execSync(`node governance/gates/run-gates.mjs preview-${changesetId}`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, MANIFESTS_DIR: previewManifests }
      });
      try {
        execSync(`node scripts/ci/release.mjs --from-changeset ${changesetId} --env dev --strategy canary`, {
          stdio: "pipe",
          env: { ...process.env, SSOT_DIR }
        });
      } catch (err) {
        const stderr = err?.stderr ? String(err.stderr) : "";
        const stdout = err?.stdout ? String(err.stdout) : "";
        return json(res, 500, { error: `Release failed: ${err.message}`, stdout, stderr });
      }
      appendAudit({ event: "studio_module_activate", module_id: moduleId, tenant_id: tenantId, at: new Date().toISOString() });
      return json(res, 200, { ok: true, release_id: latestReleaseId() });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/studio/modules/") && req.url?.endsWith("/deactivate")) {
      requirePermission(req, "studio.modules.deactivate");
      const moduleId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const tenantId = payload.tenant_id || "tenant:default";
      const changesetId = payload.changeset_id || `cs-deactivate-module-${Date.now()}`;
      requireQuorum("activate", changesetId, 2);
      const csPath = ssotPath(`changes/changesets/${changesetId}.json`);
      if (!existsSync(csPath)) {
        mkdirSync(ssotPath("changes/changesets"), { recursive: true });
        writeJson(csPath, { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] });
      }
      const activations = readJson(ssotPath("modules/module_activations.json"));
      const key = `${tenantId}:${moduleId}`;
      const exists = activations.some((a) => `${a.tenant_id}:${a.module_id}` === key);
      const op = exists
        ? { op: "update", target: { kind: "module_activation", ref: key }, value: { state: "inactive" }, preconditions: { expected_exists: true } }
        : { op: "add", target: { kind: "module_activation", ref: key }, value: { tenant_id: tenantId, module_id: moduleId, state: "inactive" }, preconditions: { expected_exists: false } };
      const cs = readJson(csPath);
      cs.ops.push(op);
      writeJson(csPath, cs);
      const previewDir = `./platform/runtime/preview/${changesetId}`;
      const previewSsot = join(previewDir, "ssot");
      const previewManifests = join(previewDir, "manifests");
      mkdirSync(previewSsot, { recursive: true });
      mkdirSync(previewManifests, { recursive: true });
      copyDir(SSOT_DIR, previewSsot);
      applyOpsToDir(previewSsot, cs.ops);
      execSync(`node scripts/ci/compile.mjs preview-${changesetId} dev`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, OUT_DIR: previewManifests }
      });
      execSync(`node governance/gates/run-gates.mjs preview-${changesetId}`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, MANIFESTS_DIR: previewManifests }
      });
      try {
        execSync(`node scripts/ci/release.mjs --from-changeset ${changesetId} --env dev --strategy canary`, {
          stdio: "pipe",
          env: { ...process.env, SSOT_DIR }
        });
      } catch (err) {
        const stderr = err?.stderr ? String(err.stderr) : "";
        const stdout = err?.stdout ? String(err.stdout) : "";
        return json(res, 500, { error: `Release failed: ${err.message}`, stdout, stderr });
      }
      appendAudit({ event: "studio_module_deactivate", module_id: moduleId, tenant_id: tenantId, at: new Date().toISOString() });
      return json(res, 200, { ok: true, release_id: latestReleaseId() });
    }

    if (req.method === "GET" && req.url === "/api/marketplace/catalog") {
      requirePermission(req, "marketplace.view");
      const catalog = readMarketplaceCatalog();
      if (!catalog.length) return json(res, 503, { error: "Catalog unavailable" });
      return json(res, 200, catalog);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/marketplace/items/")) {
      requirePermission(req, "marketplace.view");
      const parts = req.url.split("/");
      const type = parts[4];
      const id = decodeURIComponent(parts[5] || "");
      const catalog = readMarketplaceCatalog();
      const item = catalog.find((c) => c.type === type && c.id === id);
      if (!item) return json(res, 404, { error: "Not found" });
      return json(res, 200, item);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/marketplace/tenants/") && req.url?.endsWith("/installed")) {
      requirePermission(req, "marketplace.view");
      const tenantId = decodeURIComponent(req.url.split("/")[4]);
      const modules = readJson(ssotPath("modules/module_activations.json")).filter((m) => m.tenant_id === tenantId);
      const extensions = readJson(ssotPath("extensions/extension_installations.json")).filter((e) => e.tenant_id === tenantId);
      return json(res, 200, { tenant_id: tenantId, modules, extensions });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/marketplace/tenants/") && req.url?.endsWith("/impact")) {
      requirePermission(req, "marketplace.view");
      const tenantId = decodeURIComponent(req.url.split("/")[4]);
      const payload = await bodyToJson(req);
      const { type, id, version } = payload;
      const changesetId = payload.changeset_id || `cs-marketplace-impact-${Date.now()}`;
      const csPath = ssotPath(`changes/changesets/${changesetId}.json`);
      if (!existsSync(csPath)) {
        mkdirSync(ssotPath("changes/changesets"), { recursive: true });
        writeJson(csPath, { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] });
      }
      const ops = [];
      if (type === "module") {
        const activations = readJson(ssotPath("modules/module_activations.json"));
        const exists = activations.some((a) => a.tenant_id === tenantId && a.module_id === id);
        ops.push({
          op: exists ? "update" : "add",
          target: { kind: "module_activation", ref: `${tenantId}:${id}` },
          value: { tenant_id: tenantId, module_id: id, state: "active" },
          preconditions: { expected_exists: !exists ? false : true }
        });
      } else if (type === "extension") {
        const installs = readJson(ssotPath("extensions/extension_installations.json"));
        const exists = installs.some((i) => i.tenant_id === tenantId && i.extension_id === id);
        ops.push({
          op: exists ? "update" : "add",
          target: { kind: "extension_installation", ref: `${tenantId}:${id}` },
          value: { tenant_id: tenantId, extension_id: id, version: version || "1.0.0", state: "installed", installed_at: new Date().toISOString() },
          preconditions: { expected_exists: !exists ? false : true }
        });
      } else {
        return json(res, 400, { error: "Unknown type" });
      }
      const preview = buildPreviewFromOps(changesetId, ops);
      const active = loadActiveManifest();
      const previewManifest = loadManifest({ releaseId: preview.previewReleaseId, manifestsDir: preview.previewManifests, stalenessMs: 0 });
      const { result, report_path } = analyzeInstall({ activeManifest: active, previewManifest, tenantId, item: { type, id, version } });
      appendAudit({ event: "marketplace_impact", tenant_id: tenantId, item_type: type, item_id: id, at: new Date().toISOString() });
      return json(res, 200, { impact: result, report_path });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/marketplace/tenants/") && /\/(install|enable|disable|uninstall)$/.test(req.url)) {
      const action = req.url.split("/").slice(-1)[0];
      requirePermission(req, `marketplace.${action === "enable" ? "enable" : action === "disable" ? "disable" : action}`);
      const tenantId = decodeURIComponent(req.url.split("/")[4]);
      const payload = await bodyToJson(req);
      const { type, id, version, reason } = payload;
      const changesetId = payload.changeset_id || `cs-marketplace-${action}-${Date.now()}`;
      const csPath = ssotPath(`changes/changesets/${changesetId}.json`);
      if (!existsSync(csPath)) {
        mkdirSync(ssotPath("changes/changesets"), { recursive: true });
        writeJson(csPath, { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] });
      }
      const plan = getTenantPlan(tenantId);
      const ops = [];
      if (type === "module") {
        const modules = readJson(ssotPath("modules/domain_modules.json"));
        const activations = readJson(ssotPath("modules/module_activations.json"));
        const mod = modules.find((m) => m.module_id === id);
        if (!mod) return json(res, 404, { error: "Module not found" });
        const exists = activations.some((a) => a.tenant_id === tenantId && a.module_id === id);
        const desiredState = action === "disable" || action === "uninstall" ? "inactive" : "active";
        const allowed = tierRank(mod.tier) <= tierRank(plan.tier);
        if ((action === "enable" || action === "install") && !allowed) {
          const disabledState = "inactive";
          ops.push({
            op: exists ? "update" : "add",
            target: { kind: "module_activation", ref: `${tenantId}:${id}` },
            value: { tenant_id: tenantId, module_id: id, state: disabledState },
            preconditions: { expected_exists: !exists ? false : true }
          });
        } else {
          ops.push({
            op: exists ? "update" : "add",
            target: { kind: "module_activation", ref: `${tenantId}:${id}` },
            value: exists ? { state: desiredState } : { tenant_id: tenantId, module_id: id, state: desiredState },
            preconditions: { expected_exists: !exists ? false : true }
          });
        }
      } else if (type === "extension") {
        const extensions = readJson(ssotPath("extensions/extensions.json"));
        const installs = readJson(ssotPath("extensions/extension_installations.json"));
        const reviews = readJson(ssotPath("extensions/extension_reviews.json"));
        const ext = extensions.find((e) => e.id === id);
        if (!ext) return json(res, 404, { error: "Extension not found" });
        if (action === "install") requireQuorum("extension_install", changesetId, 2);
        const reviewOk = reviews.some((r) => r.extension_id === id && r.version === version && r.status === "approved");
        if ((action === "install" || action === "enable") && !reviewOk) return json(res, 400, { error: "Extension review not approved" });
        const desiredState = action === "disable" || action === "uninstall" ? "disabled" : "installed";
        const allowed = tierRank(ext.tier || "free") <= tierRank(plan.tier);
        const state = (action === "enable" || action === "install") && !allowed ? "disabled" : desiredState;
        const exists = installs.some((i) => i.tenant_id === tenantId && i.extension_id === id);
        ops.push({
          op: exists ? "update" : "add",
          target: { kind: "extension_installation", ref: `${tenantId}:${id}` },
          value: { tenant_id: tenantId, extension_id: id, version: version || "1.0.0", state, installed_at: new Date().toISOString() },
          preconditions: { expected_exists: !exists ? false : true }
        });
      } else {
        return json(res, 400, { error: "Unknown type" });
      }
      const cs = readJson(csPath);
      cs.ops.push(...ops);
      writeJson(csPath, cs);
      const preview = buildPreviewFromOps(changesetId, cs.ops);
      const active = loadActiveManifest();
      const previewManifest = loadManifest({ releaseId: preview.previewReleaseId, manifestsDir: preview.previewManifests, stalenessMs: 0 });
      const impact = analyzeInstall({ activeManifest: active, previewManifest, tenantId, item: { type, id, version } });
      const breaking = impact.result.breaking;
      if (type === "module" && action === "enable" && breaking) requireQuorum("marketplace_enable_module", changesetId, 2);
      try {
        execSync(`node scripts/ci/release.mjs --from-changeset ${changesetId} --env dev --strategy canary`, {
          stdio: "pipe",
          env: { ...process.env, SSOT_DIR }
        });
      } catch (err) {
        const stderr = err?.stderr ? String(err.stderr) : "";
        const stdout = err?.stdout ? String(err.stdout) : "";
        return json(res, 500, { error: `Release failed: ${err.message}`, stdout, stderr });
      }
      appendAudit({ event: `marketplace_${action}`, tenant_id: tenantId, item_type: type, item_id: id, reason, at: new Date().toISOString() });
      return json(res, 200, { ok: true, release_id: latestReleaseId(), impact: impact.result, report_path: impact.report_path });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/marketplace/reviews")) {
      requirePermission(req, "marketplace.review");
      const url = new URL(req.url, "http://localhost");
      const status = url.searchParams.get("status");
      const reviews = readJson(ssotPath("extensions/extension_reviews.json"));
      const list = status ? reviews.filter((r) => r.status === status) : reviews;
      return json(res, 200, list);
    }

    if (req.method === "POST" && req.url?.startsWith("/api/marketplace/reviews/") && (req.url.endsWith("/approve") || req.url.endsWith("/reject"))) {
      requirePermission(req, "marketplace.review");
      const parts = req.url.split("/");
      const reviewId = decodeURIComponent(parts[4]);
      const action = parts[5];
      const changesetId = `cs-marketplace-review-${Date.now()}`;
      const csPath = ssotPath(`changes/changesets/${changesetId}.json`);
      mkdirSync(ssotPath("changes/changesets"), { recursive: true });
      writeJson(csPath, { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] });
      const reviews = readJson(ssotPath("extensions/extension_reviews.json"));
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return json(res, 404, { error: "Review not found" });
      const updated = { status: action === "approve" ? "approved" : "rejected", approvals: review.approvals || [] };
      if (action === "approve") updated.approvals = [...new Set([...updated.approvals, "user:admin"])];
      const cs = readJson(csPath);
      cs.ops.push({ op: "update", target: { kind: "extension_review", ref: reviewId }, value: updated, preconditions: { expected_exists: true } });
      writeJson(csPath, cs);
      execSync(`node scripts/ci/apply-changeset.mjs ${changesetId}`, { stdio: "inherit", env: { ...process.env, SSOT_DIR } });
      appendAudit({ event: "marketplace_review_update", review_id: reviewId, status: updated.status, at: new Date().toISOString() });
      return json(res, 200, { ok: true, status: updated.status });
    }

    if (req.method === "PATCH" && req.url?.startsWith("/api/studio/pages/")) {
      requirePermission(req, "studio.pages.edit");
      const pageId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id, value } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "update", target: { kind: "page_definition", ref: pageId }, value, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_page_update", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/studio/routes") {
      requirePermission(req, "studio.routes.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, route_spec } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "add", target: { kind: "route_spec", ref: route_spec.route_id }, value: route_spec, preconditions: { expected_exists: false } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_route_add", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH" && req.url?.startsWith("/api/studio/routes/")) {
      requirePermission(req, "studio.routes.edit");
      const routeId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id, value } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "update", target: { kind: "route_spec", ref: routeId }, value, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_route_update", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE" && req.url?.startsWith("/api/studio/routes/")) {
      requirePermission(req, "studio.routes.delete");
      const routeId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "delete_request", target: { kind: "route_spec", ref: routeId }, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_route_delete", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/studio/nav") {
      requirePermission(req, "studio.nav.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, nav_spec } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "add", target: { kind: "nav_spec", ref: nav_spec.id }, value: nav_spec, preconditions: { expected_exists: false } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_nav_add", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH" && req.url?.startsWith("/api/studio/nav/")) {
      requirePermission(req, "studio.nav.edit");
      const navId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id, value } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "update", target: { kind: "nav_spec", ref: navId }, value, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_nav_update", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE" && req.url?.startsWith("/api/studio/nav/")) {
      requirePermission(req, "studio.nav.delete");
      const navId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "delete_request", target: { kind: "nav_spec", ref: navId }, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_nav_delete", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/studio/widgets") {
      requirePermission(req, "studio.pages.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, widget_instance } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "add", target: { kind: "widget_instance", ref: widget_instance.id }, value: widget_instance, preconditions: { expected_exists: false } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_widget_add", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE" && req.url?.startsWith("/api/studio/pages/")) {
      requirePermission(req, "studio.delete");
      const pageId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id } = payload;
      requireQuorum("delete", changeset_id, 2);
      ensureChangeset(changeset_id);
      const op = { op: "delete_request", target: { kind: "page_definition", ref: pageId }, preconditions: { expected_exists: true }, reason: "studio delete" };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      execSync(`node platform/runtime/deletion/orchestrator.mjs ${changeset_id} dev-001`, { stdio: "inherit" });
      appendAudit({ event: "studio_page_delete", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && req.url === "/api/studio/routes") {
      requirePermission(req, "studio.routes.view");
      return json(res, 200, readJson(ssotPath("studio/routes/route_specs.json")));
    }

    if (req.method === "GET" && req.url === "/api/studio/nav") {
      requirePermission(req, "studio.nav.view");
      return json(res, 200, readJson(ssotPath("studio/nav/nav_specs.json")));
    }

    if (req.method === "GET" && req.url === "/api/releases") {
      requirePermission(req, "studio.releases.view");
      const dir = ssotPath("changes/releases");
      if (!existsSync(dir)) return json(res, 200, []);
      const releases = readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => readJson(join(dir, f)));
      return json(res, 200, releases);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/finops/usage")) {
      requirePermission(req, "observability.read");
      const url = new URL(req.url, "http://localhost");
      const tenant = url.searchParams.get("tenant") || "tenant:default";
      const range = url.searchParams.get("range") || "";
      return json(res, 200, { tenant_id: tenant, usage: listUsage(tenant, range) });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/finops/budgets")) {
      requirePermission(req, "observability.read");
      const url = new URL(req.url, "http://localhost");
      const tenant = url.searchParams.get("tenant") || "tenant:default";
      const finops = getFinopsData();
      const scope = `tenant:${tenant}`;
      const budgets = (finops.budgets || []).filter((b) => scopeMatches(b.scope, scope));
      return json(res, 200, { tenant_id: tenant, budgets });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/tenants/") && req.url?.endsWith("/quotas")) {
      requirePermission(req, "observability.read");
      const tenantId = req.url.split("/")[3];
      const details = getTenantPlanDetails(tenantId);
      return json(res, 200, { tenant_id: tenantId, quotas: details.quotas });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/tenants/") && req.url?.endsWith("/plan")) {
      requirePermission(req, "observability.read");
      const tenantId = req.url.split("/")[3];
      const details = getTenantPlanDetails(tenantId);
      return json(res, 200, details);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/qos/status")) {
      requirePermission(req, "observability.read");
      const url = new URL(req.url, "http://localhost");
      const tenantId = url.searchParams.get("tenant") || "tenant:default";
      const finops = getFinopsData();
      const { plan_version } = getPlanVersionForTenant(tenantId, finops);
      const policy = getQosPolicyForTier(plan_version?.perf_tier || "free");
      return json(res, 200, { tenant_id: tenantId, tier: plan_version?.perf_tier || "free", policy });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/qos/limits")) {
      requirePermission(req, "observability.read");
      const url = new URL(req.url, "http://localhost");
      const tenantId = url.searchParams.get("tenant") || "tenant:default";
      const finops = getFinopsData();
      const { plan_version } = getPlanVersionForTenant(tenantId, finops);
      return json(res, 200, { tenant_id: tenantId, limits: plan_version || {} });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/qos/counters")) {
      requirePermission(req, "observability.read");
      const url = new URL(req.url, "http://localhost");
      const tenantId = url.searchParams.get("tenant") || "tenant:default";
      const day = url.searchParams.get("day") || new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const counters = readQosCounters(tenantId, day);
      return json(res, 200, counters);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/qos/incidents")) {
      requirePermission(req, "observability.read");
      const url = new URL(req.url, "http://localhost");
      const tenantId = url.searchParams.get("tenant") || "tenant:default";
      const day = url.searchParams.get("day") || new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const counters = readQosCounters(tenantId, day);
      const incidents = [];
      for (const [k, v] of Object.entries(counters.workloads || {})) {
        if (v.breaker_open_until && v.breaker_open_until > Date.now()) {
          incidents.push({ workload: k, breaker_open_until: v.breaker_open_until });
        }
      }
      return json(res, 200, { tenant_id: tenantId, incidents });
    }

    if (req.method === "POST" && req.url === "/api/data/ingest") {
      requirePermission(req, "observability.read");
      const payload = await bodyToJson(req);
      const tenantId = payload.tenant_id || "tenant:default";
      const modelId = payload.model_id;
      const recordId = payload.record_id || `rec-${Date.now()}`;
      const manifest = loadActiveManifest();
      if (!manifest) return json(res, 400, { error: "No active manifest" });
      appendDataIndex(tenantId, modelId, { record_id: recordId, model_id: modelId, created_at: new Date().toISOString() });
      return json(res, 200, { ok: true, record_id: recordId });
    }

    if (req.method === "POST" && req.url === "/api/data/export") {
      requirePermission(req, "data.export");
      const payload = await bodyToJson(req);
      const tenantId = payload.tenant_id || "tenant:default";
      const exportType = payload.export_type || "json";
      const records = payload.records || [];
      const manifest = loadActiveManifest();
      if (!manifest) return json(res, 400, { error: "No active manifest" });
      const ctrl = exportControl(manifest, exportType);
      if (ctrl?.requires_quorum) requireQuorum("data_export", tenantId, 2);
      const catalog = readDataCatalog(manifest);
      const mask = maskingRequired(manifest, exportType);
      let maskedCount = 0;
      const out = records.map((r) => {
        const o = { ...r };
        for (const f of catalog.data_fields || []) {
          if (!(f.path in o)) continue;
          const cls = classifyField(catalog, f.field_id);
          if (mask && cls === "pii.high") {
            o[f.path] = "***";
            maskedCount += 1;
          }
        }
        return o;
      });
      appendAudit({ event: "export_request", tenant_id: tenantId, export_type: exportType, masked_fields: maskedCount, at: new Date().toISOString() });
      return json(res, 200, { ok: true, masked_fields: maskedCount, records: out });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/releases/") && req.url?.endsWith("/activate")) {
      requirePermission(req, "studio.releases.activate");
      const id = req.url.split("/")[3];
      requireQuorum("activate", id, 2);
      const payload = await bodyToJson(req);
      const changesetId = payload?.changeset_id || `cs-activate-${Date.now()}`;
      const csPath = ssotPath(`changes/changesets/${changesetId}.json`);
      if (!existsSync(csPath)) {
        mkdirSync(ssotPath("changes/changesets"), { recursive: true });
        writeJson(csPath, { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] });
      }
      const op = {
        op: "update",
        target: { kind: "active_release", ref: "active_release" },
        value: {
          active_release_id: id,
          active_env: payload?.env || "dev",
          updated_at: new Date().toISOString(),
          updated_by: "studio"
        },
        preconditions: { expected_exists: true }
      };
      const cs = readJson(csPath);
      cs.ops.push(op);
      writeJson(csPath, cs);
      execSync(`node scripts/ci/apply-changeset.mjs ${changesetId}`, { stdio: "inherit", env: { ...process.env, SSOT_DIR } });
      appendAudit({ event: "active_release_update", release_id: id, at: new Date().toISOString() });
      return json(res, 200, { ok: true, active_release_id: id });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/releases/") && req.url?.endsWith("/rollback")) {
      requirePermission(req, "studio.releases.rollback");
      const id = req.url.split("/")[3];
      requireQuorum("rollback", id, 2);
      execSync(`node -e \"import {rollback} from './platform/runtime/release/orchestrator.mjs'; rollback('${id}','manual');\"`, { stdio: "inherit" });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/governance/break-glass/request") {
      requirePermission(req, "breakglass.request");
      const payload = await bodyToJson(req);
      const changesetId = `cs-breakglass-${Date.now()}`;
      const expiresAt = payload.expires_at || new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const update = {
        enabled: false,
        reason: payload.reason || "",
        requested_by: payload.requested_by || "user:admin",
        approved_by: [],
        expires_at: expiresAt,
        scope: payload.scope || "platform:*",
        allowed_actions: payload.allowed_actions || []
      };
      writeJson(ssotPath(`changes/changesets/${changesetId}.json`), { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [
        { op: "update", target: { kind: "break_glass", ref: "break_glass" }, value: update, preconditions: { expected_exists: true } }
      ] });
      execSync(`node scripts/ci/apply-changeset.mjs ${changesetId}`, { stdio: "inherit", env: { ...process.env, SSOT_DIR } });
      writeJson(reviewFilename("breakglass", "enable"), { id: "breakglass-enable", action: "breakglass.enable", target_id: "break_glass", required_approvals: 2, approvals: [], status: "pending" });
      appendAudit({ event: "break_glass_request", at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/governance/break-glass/approve") {
      requirePermission(req, "breakglass.approve");
      const payload = await bodyToJson(req);
      const userId = payload.user_id || req.headers["x-user-id"] || "user:admin";
      const reviewPath = reviewFilename("breakglass", "enable");
      if (!existsSync(reviewPath)) return json(res, 400, { error: "No break-glass request" });
      const review = readJson(reviewPath);
      review.approvals = Array.from(new Set([...(review.approvals || []), userId]));
      if (review.approvals.length >= (review.required_approvals || 2)) review.status = "approved";
      writeJson(reviewPath, review);
      const bgPath = ssotPath("governance/break_glass.json");
      const bg = readJson(bgPath);
      bg.approved_by = review.approvals;
      if (review.status === "approved") bg.enabled = true;
      writeJson(bgPath, bg);
      appendAudit({ event: "break_glass_approve", at: new Date().toISOString(), user_id: userId });
      return json(res, 200, { ok: true, status: review.status });
    }

    if (req.method === "POST" && req.url === "/api/governance/break-glass/disable") {
      requirePermission(req, "breakglass.disable");
      const bgPath = ssotPath("governance/break_glass.json");
      const bg = readJson(bgPath);
      bg.enabled = false;
      writeJson(bgPath, bg);
      appendAudit({ event: "break_glass_disable", at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/ops/incidents") {
      requirePermission(req, "ops.incident.create");
      const payload = await bodyToJson(req);
      const incident = createIncident({
        severity_id: payload.severity_id || "sev3",
        scope: payload.scope || "platform:*",
        title: payload.title || "Ops Incident",
        links: payload.links || {},
        notes: payload.notes || []
      });
      appendAudit({ event: "ops_incident_create", incident_id: incident.id, at: new Date().toISOString() });
      return json(res, 201, incident);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/ops/incidents/")) {
      requirePermission(req, "ops.incident.read");
      const id = req.url.split("/")[4];
      const incident = readIncident(id);
      if (!incident) return json(res, 404, { error: "Incident not found" });
      return json(res, 200, incident);
    }

    if (req.method === "POST" && req.url?.includes("/api/ops/incidents/") && req.url?.includes("/runbooks/") && req.url?.endsWith("/execute")) {
      requirePermission(req, "ops.runbook.execute");
      const parts = req.url.split("/");
      const incidentId = parts[4];
      const runbookId = parts[6];
      const manifest = loadActiveManifest();
      if (!manifest) return json(res, 503, { error: "Manifest not available" });
      const gov = getGovernanceData();
      const result = executeRunbook({
        incidentId,
        runbookId,
        manifest,
        authorizeAction: (action, scope, resource) => authorizeAction(req, `ops.action.${action}`, scope, resource),
        requireQuorum,
        breakGlass: gov.breakGlass,
        apply: false
      });
      appendAudit({ event: "ops_runbook_execute", incident_id: incidentId, runbook_id: runbookId, at: new Date().toISOString() });
      return json(res, 200, result);
    }

    if (req.method === "POST" && req.url?.includes("/api/ops/incidents/") && req.url?.includes("/runbooks/") && req.url?.endsWith("/apply")) {
      requirePermission(req, "ops.runbook.apply");
      const parts = req.url.split("/");
      const incidentId = parts[4];
      const runbookId = parts[6];
      const manifest = loadActiveManifest();
      if (!manifest) return json(res, 503, { error: "Manifest not available" });
      const gov = getGovernanceData();
      const result = executeRunbook({
        incidentId,
        runbookId,
        manifest,
        authorizeAction: (action, scope, resource) => authorizeAction(req, `ops.action.${action}`, scope, resource),
        requireQuorum,
        breakGlass: gov.breakGlass,
        apply: true
      });
      const incidentPath = join(process.cwd(), "runtime", "ops", "incidents", `${incidentId}.json`);
      if (existsSync(incidentPath)) {
        const incident = readJson(incidentPath);
        incident.status = "mitigating";
        writeJson(incidentPath, incident);
      }
      appendAudit({ event: "ops_runbook_apply", incident_id: incidentId, runbook_id: runbookId, at: new Date().toISOString() });
      return json(res, 200, result);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/ops/timeline")) {
      requirePermission(req, "ops.timeline.read");
      const url = new URL(req.url, "http://localhost");
      const day = url.searchParams.get("day") || undefined;
      return json(res, 200, { events: listTimeline(day) });
    }

    if (req.method === "POST" && req.url === "/api/tenancy/factory/plan") {
      requirePermission(req, "ops.tenancy.plan");
      const payload = await bodyToJson(req);
      const plan = planTenantCreate({
        templateId: payload.template_id || "tmpl:default",
        tenantKey: payload.tenant_key,
        displayName: payload.display_name,
        ownerUserId: payload.owner_user_id
      });
      const report = dryRunCreate(plan);
      return json(res, 200, { ok: true, plan, report });
    }

    if (req.method === "POST" && req.url === "/api/tenancy/factory/apply") {
      requirePermission(req, "ops.tenancy.apply");
      const payload = await bodyToJson(req);
      const plan = planTenantCreate({
        templateId: payload.template_id || "tmpl:default",
        tenantKey: payload.tenant_key,
        displayName: payload.display_name,
        ownerUserId: payload.owner_user_id
      });
      const gov = getGovernanceData();
      if (!breakGlassAllows({ breakGlass: gov.breakGlass, action: "ops.tenancy.apply", scope: "platform:*" })) {
        requireQuorum("tenant_create", plan.tenant_id, 2);
      }
      const changesetId = applyCreate(plan);
      return json(res, 200, { ok: true, changeset_id: changesetId, tenant_id: plan.tenant_id });
    }

    if (req.method === "POST" && req.url === "/api/tenancy/factory/clone/plan") {
      requirePermission(req, "ops.tenancy.clone.plan");
      const payload = await bodyToJson(req);
      const plan = planTenantClone({
        sourceTenantId: payload.source_tenant_id,
        targetKey: payload.tenant_key,
        displayName: payload.display_name,
        ownerUserId: payload.owner_user_id
      });
      const report = dryRunCreate(plan);
      return json(res, 200, { ok: true, plan, report });
    }

    if (req.method === "POST" && req.url === "/api/tenancy/factory/clone/apply") {
      requirePermission(req, "ops.tenancy.clone.apply");
      const payload = await bodyToJson(req);
      const plan = planTenantClone({
        sourceTenantId: payload.source_tenant_id,
        targetKey: payload.tenant_key,
        displayName: payload.display_name,
        ownerUserId: payload.owner_user_id
      });
      const gov = getGovernanceData();
      if (!breakGlassAllows({ breakGlass: gov.breakGlass, action: "ops.tenancy.clone.apply", scope: "platform:*" })) {
        requireQuorum("tenant_clone", plan.tenant_id, 2);
      }
      const changesetId = applyCreate(plan);
      return json(res, 200, { ok: true, changeset_id: changesetId, tenant_id: plan.tenant_id });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/tenancy/factory/status")) {
      requirePermission(req, "ops.tenancy.plan");
      const url = new URL(req.url, "http://localhost");
      const id = url.searchParams.get("id") || "";
      const status = id ? readFactoryStatus(id) : null;
      if (!status) return json(res, 404, { error: "Not found" });
      return json(res, 200, status);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/gates/") && req.url?.endsWith("/report")) {
      requirePermission(req, "studio.releases.view");
      const id = req.url.split("/")[3];
      const path = "./governance/gates/gates-report.json";
      if (!existsSync(path)) return json(res, 404, { error: "No gates report" });
      return json(res, 200, readJson(path));
    }

    if (req.method === "GET" && req.url === "/api/drift/status") {
      return json(res, 200, { status: "unknown" });
    }

    if (req.method === "GET" && req.url === "/api/drift/report") {
      const path = "./platform/runtime/drift/drift-report.md";
      return json(res, 200, { report: existsSync(path) ? readFileSync(path, "utf-8") : "" });
    }

    if (req.method === "GET" && req.url === "/api/qos/test-error") {
      return json(res, 500, { error: "qos test error" });
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    const status = err.statusCode || 400;
    return json(res, status, { error: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Write Gateway listening on ${PORT}`);
});
