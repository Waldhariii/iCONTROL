import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { rollback, compileSignedManifest, activate } from "../release/orchestrator.mjs";
import { applyChangeset } from "../changes/patch-engine.mjs";
import { sha256, stableStringify } from "../../compilers/utils.mjs";
import { planTenantCreate, planTenantClone, dryRunCreate, applyCreate, verifyCreate } from "../tenancy/factory.mjs";
import { execSync } from "child_process";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const RUNTIME_OPS_DIR = join(process.cwd(), "runtime", "ops");
const REPORTS_DIR = join(process.cwd(), "runtime", "reports");

function assertNoPlatformReportsPath(path) {
  if (String(path).includes("platform/runtime/reports")) {
    throw new Error("Forbidden reports path: platform/runtime/reports");
  }
}

function appendOpsReport({ action, params, context, outcome }) {
  assertNoPlatformReportsPath(REPORTS_DIR);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = join(REPORTS_DIR, `OPS_EVENT_${ts}.md`);
  const indexPath = join(REPORTS_DIR, "index", "ops_events.jsonl");
  const entry = {
    ts: new Date().toISOString(),
    request_id: context?.request_id || "",
    actor_id: context?.actor_id || "ops",
    tenant_id: context?.tenant_id || "",
    action,
    outcome: outcome || "ok",
    params: { ...params, secret: undefined }
  };
  mkdirSync(dirname(reportPath), { recursive: true });
  mkdirSync(dirname(indexPath), { recursive: true });
  const lines = [
    "# Ops Event",
    `request_id: ${entry.request_id}`,
    `actor_id: ${entry.actor_id}`,
    `tenant_id: ${entry.tenant_id}`,
    `action: ${action}`,
    `outcome: ${entry.outcome}`,
    `timestamp: ${entry.ts}`,
    "",
    "## Params",
    JSON.stringify(entry.params, null, 2)
  ];
  writeFileSync(reportPath, lines.join("\n") + "\n", "utf-8");
  writeFileSync(indexPath, JSON.stringify({ ...entry, report_path: reportPath }) + "\n", { flag: "a" });
  return reportPath;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function appendAudit(entry) {
  const path = join(SSOT_DIR, "governance/audit_ledger.json");
  const ledger = existsSync(path) ? readJson(path) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeJson(path, ledger);
}

function readOpsOverrides() {
  const path = join(RUNTIME_OPS_DIR, "qos_overrides.json");
  if (!existsSync(path)) return { overrides: [] };
  return readJson(path);
}

function writeOpsOverrides(data) {
  const path = join(RUNTIME_OPS_DIR, "qos_overrides.json");
  writeJson(path, data);
}

function pruneExpired(overrides) {
  const now = Date.now();
  return overrides.filter((o) => !o.expires_at || Date.parse(o.expires_at) > now);
}

function matchTarget(override, { tenantId, tier, workload }) {
  const tgt = override.target || "";
  if (override.workload && override.workload !== workload) return false;
  if (tgt.startsWith("tenant:") && tenantId) return tgt === `tenant:${tenantId}`;
  if (tgt.startsWith("tier:") && tier) return tgt === `tier:${tier}`;
  if (tgt === "platform:*") return true;
  return false;
}

function updateConnectorState({ connectorId, tenantId, state }) {
  const path = join(SSOT_DIR, "integrations/connector_configs.json");
  const configs = readJson(path);
  const updated = configs.map((c) => {
    if (c.connector_id === connectorId && c.tenant_id === tenantId) return { ...c, state };
    return c;
  });
  writeJson(path, updated);
}

function upsertKillswitch({ scope, tenantId, extensionId, enabled, reason }) {
  const path = join(SSOT_DIR, "extensions/extension_killswitch.json");
  const list = readJson(path);
  const existing = list.find((k) => k.extension_id === extensionId && k.scope === scope && (k.tenant_id || "") === (tenantId || ""));
  const payload = {
    scope,
    tenant_id: tenantId || "",
    extension_id: extensionId,
    enabled: Boolean(enabled),
    reason: reason || "ops action",
    enabled_at: new Date().toISOString(),
    enabled_by: "ops"
  };
  if (existing) {
    Object.assign(existing, payload);
  } else {
    list.push(payload);
  }
  writeJson(path, list);
}

function updateBreakGlass({ enabled, reason, ttlSeconds, scope, allowedActions }) {
  const path = join(SSOT_DIR, "governance/break_glass.json");
  const now = new Date();
  const expiresAt = ttlSeconds ? new Date(now.getTime() + ttlSeconds * 1000).toISOString() : new Date(now.getTime() + 900000).toISOString();
  const updated = {
    enabled: Boolean(enabled),
    reason: reason || "ops action",
    requested_by: "ops",
    approved_by: ["ops"],
    expires_at: expiresAt,
    scope: scope || "platform:*",
    allowed_actions: allowedActions || []
  };
  writeJson(path, updated);
}

function applyChangeFreeze({ enabled, reason }) {
  const csId = `cs-ops-freeze-${Date.now()}`;
  const csPath = join(SSOT_DIR, "changes/changesets", `${csId}.json`);
  mkdirSync(dirname(csPath), { recursive: true });
  const current = readJson(join(SSOT_DIR, "governance/change_freeze.json"));
  const update = {
    ...current,
    enabled: Boolean(enabled),
    reason: reason || current.reason || "ops change freeze",
    enabled_at: new Date().toISOString(),
    enabled_by: "ops"
  };
  const cs = {
    id: csId,
    status: "draft",
    created_by: "ops",
    created_at: new Date().toISOString(),
    scope: "global",
    ops: [
      { op: "update", target: { kind: "change_freeze", ref: "change_freeze" }, value: update, preconditions: { expected_exists: true } }
    ]
  };
  writeJson(csPath, cs);
  applyChangeset(csId);
  return { changeset_id: csId };
}

export const BUILTIN_ACTIONS = [
  "qos.throttle",
  "qos.shed",
  "release.rollback",
  "release.compile",
  "release.activate",
  "packs.import",
  "packs.activate",
  "dr_drill.from_pack",
  "rotation.dry_run",
  "bootstrap.proof",
  "extension.killswitch",
  "change.freeze",
  "integration.disable",
  "open.break_glass",
  "close.break_glass",
  "tenancy.factory.plan",
  "tenancy.factory.apply",
  "tenancy.factory.clone.plan",
  "tenancy.factory.clone.apply"
];

export function applyAction({ action, params, context }) {
  if (!BUILTIN_ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`);

  if (action === "qos.throttle") {
    const overrides = readOpsOverrides();
    const list = pruneExpired(overrides.overrides || []);
    const duration = Number(params?.duration_s || 300);
    const entry = {
      id: `qos-throttle-${Date.now()}`,
      type: "throttle",
      target: params?.target || "platform:*",
      workload: params?.workload || "api",
      factor: Number(params?.factor || 1),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + duration * 1000).toISOString()
    };
    list.push(entry);
    writeOpsOverrides({ overrides: list });
    appendOpsReport({ action, params, context, outcome: "ok" });
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true, entry };
  }

  if (action === "packs.import") {
    const pack = params?.pack_path || "";
    const cmd = pack
      ? `node scripts/maintenance/import-release-pack.mjs --pack ${pack} --mode staging`
      : "node scripts/maintenance/import-release-pack.mjs --mode staging";
    const out = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
    appendOpsReport({ action, params, context, outcome: "ok" });
    return { output: out.trim() };
  }

  if (action === "packs.activate") {
    const pack = params?.pack_path || "";
    const cmd = pack
      ? `node scripts/maintenance/import-release-pack.mjs --pack ${pack} --mode activate`
      : "node scripts/maintenance/import-release-pack.mjs --mode activate";
    const out = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
    appendOpsReport({ action, params, context, outcome: "ok" });
    return { output: out.trim() };
  }

  if (action === "dr_drill.from_pack") {
    const pack = params?.pack_path || "";
    const cmd = pack
      ? `node scripts/maintenance/dr-drill-from-pack.mjs --pack ${pack}`
      : "node scripts/maintenance/dr-drill-from-pack.mjs";
    const out = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
    appendOpsReport({ action, params, context, outcome: "ok" });
    return { output: out.trim() };
  }

  if (action === "rotation.dry_run") {
    const out = execSync("node scripts/maintenance/run-rotation.mjs --dry-run", { encoding: "utf-8", stdio: "pipe" });
    appendOpsReport({ action, params, context, outcome: "ok" });
    return { output: out.trim() };
  }

  if (action === "bootstrap.proof") {
    const out = execSync("node scripts/maintenance/bootstrap.mjs --ci-safe", { encoding: "utf-8", stdio: "pipe" });
    appendOpsReport({ action, params, context, outcome: "ok" });
    return { output: out.trim() };
  }

  if (action === "qos.shed") {
    const overrides = readOpsOverrides();
    const list = pruneExpired(overrides.overrides || []);
    const duration = Number(params?.duration_s || 300);
    const entry = {
      id: `qos-shed-${Date.now()}`,
      type: "shed",
      target: params?.target || "platform:*",
      workload: params?.workload || "api",
      mode: params?.mode || "deny",
      rate: Number(params?.rate || 1),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + duration * 1000).toISOString()
    };
    list.push(entry);
    writeOpsOverrides({ overrides: list });
    appendOpsReport({ action, params, context, outcome: "ok" });
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true, entry };
  }

  if (action === "release.rollback") {
    const rel = params?.release_id || "active";
    rollback(rel, params?.reason || "ops rollback");
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true };
  }

  if (action === "release.compile") {
    const releaseId = params?.release_id || `rel-${Date.now()}`;
    const env = params?.env || "dev";
    compileSignedManifest(releaseId, env);
    appendAudit({ event: "ops_action", action, params: { release_id: releaseId }, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true, release_id: releaseId };
  }

  if (action === "release.activate") {
    const releaseId = params?.release_id || "active";
    const scope = params?.scope || "platform:*";
    activate(releaseId, scope);
    appendAudit({ event: "ops_action", action, params: { release_id: releaseId, scope }, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true };
  }

  if (action === "extension.killswitch") {
    if (!params?.extension_id) throw new Error("extension_id required");
    upsertKillswitch({
      scope: params?.scope || "platform",
      tenantId: params?.tenant_id || "",
      extensionId: params?.extension_id,
      enabled: params?.enabled !== false,
      reason: params?.reason || "ops killswitch"
    });
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true };
  }

  if (action === "integration.disable") {
    if (!params?.connector_id || !params?.tenant_id) throw new Error("connector_id and tenant_id required");
    updateConnectorState({ connectorId: params?.connector_id, tenantId: params?.tenant_id, state: "disabled" });
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true };
  }

  if (action === "change.freeze") {
    const result = applyChangeFreeze({ enabled: params?.enabled !== false, reason: params?.reason || "ops change freeze" });
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true, ...result };
  }

  if (action === "open.break_glass") {
    if (!(params?.allowed_actions || []).length) throw new Error("allowed_actions required");
    updateBreakGlass({
      enabled: true,
      reason: params?.reason || "ops break glass",
      ttlSeconds: Number(params?.ttl || 900),
      scope: params?.scope || "platform:*",
      allowedActions: params?.allowed_actions || []
    });
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true };
  }

  if (action === "close.break_glass") {
    updateBreakGlass({ enabled: false, reason: params?.reason || "ops close break glass", ttlSeconds: 1, scope: "platform:*", allowedActions: [] });
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true };
  }

  if (action === "tenancy.factory.plan") {
    const plan = planTenantCreate({ templateId: params?.template_id, tenantKey: params?.tenant_key, displayName: params?.display_name, ownerUserId: params?.owner_user_id });
    const report = dryRunCreate(plan);
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true, plan_id: plan.plan_id, report };
  }

  if (action === "tenancy.factory.apply") {
    const plan = planTenantCreate({ templateId: params?.template_id, tenantKey: params?.tenant_key, displayName: params?.display_name, ownerUserId: params?.owner_user_id });
    const changesetId = applyCreate(plan);
    verifyCreate(plan);
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true, changeset_id: changesetId, tenant_id: plan.tenant_id };
  }

  if (action === "tenancy.factory.clone.plan") {
    const plan = planTenantClone({ sourceTenantId: params?.source_tenant_id, targetKey: params?.tenant_key, displayName: params?.display_name, ownerUserId: params?.owner_user_id });
    const report = dryRunCreate(plan);
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id, request_id: context?.request_id });
    return { ok: true, plan_id: plan.plan_id, report };
  }

  if (action === "tenancy.factory.clone.apply") {
    const plan = planTenantClone({ sourceTenantId: params?.source_tenant_id, targetKey: params?.tenant_key, displayName: params?.display_name, ownerUserId: params?.owner_user_id });
    const changesetId = applyCreate(plan);
    verifyCreate(plan);
    appendAudit({ event: "ops_action", action, params, at: new Date().toISOString(), incident_id: context?.incident_id });
    return { ok: true, changeset_id: changesetId, tenant_id: plan.tenant_id };
  }

  return { ok: false };
}

export function getEffectiveQosOverrides({ tenantId, tier, workload }) {
  const data = readOpsOverrides();
  const list = pruneExpired(data.overrides || []);
  const matching = list.filter((o) => matchTarget(o, { tenantId, tier, workload }));
  return matching;
}
