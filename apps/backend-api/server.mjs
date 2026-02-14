import http from "http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join, normalize } from "path";
import { execSync } from "child_process";
import { applyOpsToDir } from "../../platform/runtime/changes/patch-engine.mjs";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";
import { sha256, stableStringify } from "../../platform/compilers/utils.mjs";

const PORT = process.env.PORT || 7070;
const ROOT = process.cwd();
const SSOT_DIR = process.env.SSOT_DIR ? normalize(process.env.SSOT_DIR) : normalize(join(ROOT, "platform/ssot"));
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

function effectiveQuotas(tenantId, finops) {
  const planId = pickPlanId(tenantId, finops);
  const pv = pickPlanVersion(planId, finops);
  const base = pv?.quotas || {};
  const override = (finops.tenantQuotas || []).find((q) => q.tenant_id === tenantId);
  const quotas = { ...base, ...(override?.quotas || {}) };
  return { plan_id: planId, plan_version: pv?.version || "", quotas };
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
  return join("./platform/runtime/finops/usage", safe, `${dateKey}.json`);
}

function readUsage(tenantId, dateKey) {
  const path = usagePath(tenantId, dateKey);
  if (existsSync(path)) return readJson(path);
  return {
    tenant_id: tenantId,
    date: dateKey,
    requests_per_day: 0,
    cpu_ms_per_day: 0,
    storage_mb: 0,
    ocr_pages_per_month: 0
  };
}

function writeUsage(tenantId, dateKey, usage) {
  const path = usagePath(tenantId, dateKey);
  mkdirSync(dirname(path), { recursive: true });
  writeJson(path, usage);
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
    }
  }
}

function enforceQuotasAndBudgets(tenantId) {
  const finops = getFinopsData();
  const { quotas } = effectiveQuotas(tenantId, finops);
  const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const usage = readUsage(tenantId, dateKey);

  if (quotas.requests_per_day !== undefined && usage.requests_per_day >= quotas.requests_per_day) {
    throw new Error("Quota exceeded: requests_per_day");
  }
  if (quotas.cpu_ms_per_day !== undefined && usage.cpu_ms_per_day >= quotas.cpu_ms_per_day) {
    throw new Error("Quota exceeded: cpu_ms_per_day");
  }

  usage.requests_per_day += 1;
  writeUsage(tenantId, dateKey, usage);
  checkBudgets({ tenantId, usage, finops });
  return { tenantId, dateKey, quotas };
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
  return allow.some((p) => actionMatches(p, action));
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
  return readJson(path);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url?.startsWith("/api/")) requireAdmin(req);
    const tenantHeader = req.headers["x-tenant-id"];
    const tenantId = typeof tenantHeader === "string" && tenantHeader ? tenantHeader : null;
    const startAt = Date.now();
    const meterCtx = tenantId ? enforceQuotasAndBudgets(tenantId) : null;
    if (meterCtx) {
      res.on("finish", () => {
        const elapsed = Date.now() - startAt;
        const usage = readUsage(meterCtx.tenantId, meterCtx.dateKey);
        usage.cpu_ms_per_day += Math.max(0, elapsed);
        writeUsage(meterCtx.tenantId, meterCtx.dateKey, usage);
      });
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
      const manifestsDir = previewId ? `./platform/runtime/preview/${previewId}/manifests` : undefined;
      const manifest = loadManifest({ releaseId, stalenessMs: 0, manifestsDir });
      return json(res, 200, manifest);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/runtime/active-release")) {
      return json(res, 200, readActiveRelease());
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

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 400, { error: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Write Gateway listening on ${PORT}`);
});
