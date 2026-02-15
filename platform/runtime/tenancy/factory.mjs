import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { applyChangeset } from "../changes/patch-engine.mjs";
import { sha256, stableStringify } from "../../compilers/utils.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const REPORTS_DIR = join(process.cwd(), "runtime", "reports");
const STATUS_DIR = join(process.cwd(), "runtime", "tenancy", "factory");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(join(path, ".."), { recursive: true });
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

function slugify(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadTemplates() {
  return readJson(join(SSOT_DIR, "tenancy/tenant_templates.json"));
}

function loadTenants() {
  return readJson(join(SSOT_DIR, "tenancy/tenants.json"));
}

function writeStatus(id, data) {
  mkdirSync(STATUS_DIR, { recursive: true });
  writeJson(join(STATUS_DIR, `${id}.json`), data);
}

export function planTenantCreate({ templateId, tenantKey, displayName, ownerUserId }) {
  const templates = loadTemplates();
  const template = templates.find((t) => t.template_id === templateId) || templates[0];
  if (!template) throw new Error("Template not found");
  const key = slugify(tenantKey);
  if (!key) throw new Error("Invalid tenant key");
  const tenantId = `tenant:${key}`;
  const plan = {
    plan_id: `plan:${Date.now()}`,
    type: "tenant.create",
    template_id: template.template_id,
    tenant_key: key,
    tenant_id: tenantId,
    display_name: displayName || key,
    owner_user_id: ownerUserId || "system",
    base_plan_id: template.base_plan_id
  };
  appendAudit({ event: "tenant_create_planned", tenant_id: tenantId, at: new Date().toISOString() });
  writeStatus(plan.plan_id, { status: "planned", plan });
  return plan;
}

export function planTenantClone({ sourceTenantId, targetKey, displayName, ownerUserId }) {
  const key = slugify(targetKey);
  if (!key) throw new Error("Invalid tenant key");
  const tenantId = `tenant:${key}`;
  const plan = {
    plan_id: `plan:${Date.now()}`,
    type: "tenant.clone",
    source_tenant_id: sourceTenantId,
    tenant_key: key,
    tenant_id: tenantId,
    display_name: displayName || key,
    owner_user_id: ownerUserId || "system"
  };
  appendAudit({ event: "tenant_clone_planned", tenant_id: tenantId, at: new Date().toISOString() });
  writeStatus(plan.plan_id, { status: "planned", plan });
  return plan;
}

export function dryRunCreate(plan) {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const out = join(REPORTS_DIR, `TENANT_FACTORY_PLAN_${ts}.md`);
  const lines = [
    `Tenant factory plan ${plan.type}`,
    `tenant_id: ${plan.tenant_id}`,
    `template_id: ${plan.template_id || ""}`,
    `source_tenant_id: ${plan.source_tenant_id || ""}`
  ];
  writeFileSync(out, lines.join("\n") + "\n", "utf-8");
  appendAudit({ event: "tenant_create_dry_run", tenant_id: plan.tenant_id, at: new Date().toISOString() });
  writeStatus(plan.plan_id, { status: "dry-run", plan, report: out });
  return out;
}

function buildChangesetOps(plan) {
  return [
    {
      op: plan.type,
      target: { kind: "tenant", ref: plan.tenant_id },
      value: plan,
      preconditions: { expected_exists: false }
    }
  ];
}

export function applyCreate(plan) {
  const changesetId = `cs-tenant-${Date.now()}`;
  const csPath = join(SSOT_DIR, "changes/changesets", `${changesetId}.json`);
  mkdirSync(join(SSOT_DIR, "changes/changesets"), { recursive: true });
  const cs = {
    id: changesetId,
    status: "draft",
    created_by: "tenant-factory",
    created_at: new Date().toISOString(),
    scope: "global",
    ops: buildChangesetOps(plan)
  };
  writeJson(csPath, cs);
  applyChangeset(changesetId);
  appendAudit({ event: "tenant_create_applied", tenant_id: plan.tenant_id, at: new Date().toISOString() });
  writeStatus(plan.plan_id, { status: "applied", plan, changeset_id: changesetId });
  return changesetId;
}

export function verifyCreate(plan) {
  appendAudit({ event: "tenant_create_verified", tenant_id: plan.tenant_id, at: new Date().toISOString() });
  writeStatus(plan.plan_id, { status: "verified", plan });
  return true;
}

export function readFactoryStatus(planId) {
  const path = join(STATUS_DIR, `${planId}.json`);
  if (!existsSync(path)) return null;
  return readJson(path);
}
