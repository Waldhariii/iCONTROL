import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, renameSync } from "fs";
import { join, dirname } from "path";
import { sha256, stableStringify } from "../../compilers/utils.mjs";
import { validateOrThrow } from "../../../core/contracts/schema/validate.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const LOCK_PATH = "./platform/runtime/changes/changes.lock";
const SNAPSHOT_DIR = join(SSOT_DIR, "changes/snapshots");
const AUDIT_PATH = join(SSOT_DIR, "governance/audit_ledger.json");

const kindToPath = {
  page_definition: "studio/pages/page_definitions.json",
  page_version: "studio/pages/page_instances.json",
  route_spec: "studio/routes/route_specs.json",
  nav_spec: "studio/nav/nav_specs.json",
  widget_instance: "studio/widgets/widget_instances.json",
  widget_catalog: "studio/widgets/widget_catalog.json",
  domain_module: "modules/domain_modules.json",
  domain_module_version: "modules/domain_module_versions.json",
  module_activation: "modules/module_activations.json",
  query_catalog: "data/query_catalog.json",
  query_budget: "data/query_budgets.json",
  retention_policy: "data/policies/retention_policies.json",
  retention_version: "data/policies/retention_versions.json",
  form_schema: "studio/forms/form_schemas.json",
  tenant_template: "tenancy/tenant_templates.json",
  tenant_template_version: "tenancy/tenant_template_versions.json",
  extension_installation: "extensions/extension_installations.json",
  extension_review: "extensions/extension_reviews.json",
  design_token: "design/design_tokens.json",
  theme: "design/themes.json",
  active_release: "changes/active_release.json",
  break_glass: "governance/break_glass.json",
  change_freeze: "governance/change_freeze.json",
  runbook: "ops/runbooks.json",
  runbook_version: "ops/runbook_versions.json",
  mitigation_policy: "ops/mitigation_policies.json",
  secret_binding: "security/secret_bindings.json",
  service_principal: "security/service_principals.json",
  service_credential: "security/service_credentials.json",
  token_exchange_policy: "security/token_exchange_policies.json"
};

const kindToSchema = {
  page_definition: "page_definition.v1",
  page_version: "page_version.v1",
  route_spec: "route_spec.v1",
  nav_spec: "array_of_objects.v1",
  widget_instance: "array_of_objects.v1",
  widget_catalog: "array_of_objects.v1",
  domain_module: "domain_module.v1",
  domain_module_version: "domain_module_version.v1",
  module_activation: "module_activation.v1",
  query_catalog: "array_of_objects.v1",
  query_budget: "array_of_objects.v1",
  retention_policy: "retention_policy.v1",
  retention_version: "retention_version.v1",
  form_schema: "array_of_objects.v1",
  tenant_template: "tenant_template.v1",
  tenant_template_version: "tenant_template_version.v1",
  extension_installation: "extension_installation.v1",
  extension_review: "extension_review.v1",
  design_token: "design_token.v1",
  theme: "theme.v1",
  active_release: "active_release.v1",
  break_glass: "break_glass.v1",
  change_freeze: "change_freeze.v1",
  runbook: "runbook.v1",
  runbook_version: "runbook_version.v1",
  mitigation_policy: "mitigation_policy.v1",
  secret_binding: "secret_binding.v1",
  service_principal: "service_principal.v1",
  service_credential: "service_credential.v1",
  token_exchange_policy: "token_exchange_policy.v1"
};

function itemKey(kind, item) {
  if (!item) return "";
  if (kind === "route_spec") return item.route_id;
  if (kind === "page_version") return item.page_id;
  if (kind === "domain_module") return item.module_id;
  if (kind === "domain_module_version") return `${item.module_id}@${item.version}`;
  if (kind === "module_activation") return `${item.tenant_id}:${item.module_id}`;
  if (kind === "tenant_template") return item.template_id;
  if (kind === "tenant_template_version") return `${item.template_id}@${item.version}`;
  if (kind === "runbook") return item.runbook_id;
  if (kind === "runbook_version") return `${item.runbook_id}@${item.version}`;
  if (kind === "mitigation_policy") return item.policy_id;
  if (kind === "extension_installation") return `${item.tenant_id}:${item.extension_id}`;
  if (kind === "secret_binding") return item.id;
  return item.id;
}

function findIndexByRef(dataArray, kind, ref) {
  return dataArray.findIndex((x) => itemKey(kind, x) === ref);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function acquireLock() {
  if (existsSync(LOCK_PATH)) throw new Error("Changeset lock active");
  writeFileSync(LOCK_PATH, String(Date.now()));
}

function releaseLock() {
  if (existsSync(LOCK_PATH)) rmSync(LOCK_PATH);
}

function snapshot(label) {
  const id = `${label}-${Date.now()}`;
  const out = join(SNAPSHOT_DIR, id);
  mkdirSync(out, { recursive: true });
  copyDir(SSOT_DIR, out);
  return out;
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (s.includes("/changes/snapshots")) continue;
    if (entry.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

function checksumFile(path) {
  return sha256(readFileSync(path, "utf-8"));
}

function applyOp(dataArray, op) {
  if (!Array.isArray(dataArray)) {
    if (op.op === "update") {
      if (op.path) {
        dataArray[op.path] = op.value;
      } else {
        Object.assign(dataArray, op.value);
      }
      return;
    }
    throw new Error(`Unsupported op for object target: ${op.op}`);
  }
  const targetRef = op.target.ref;
  const kind = op.target.kind;
  if (op.op === "add") {
    dataArray.push(op.value);
  } else if (op.op === "replace_all") {
    if (!Array.isArray(op.value)) throw new Error("replace_all requires array value");
    dataArray.length = 0;
    dataArray.push(...op.value);
  } else if (op.op === "update") {
    const idx = findIndexByRef(dataArray, kind, targetRef);
    if (idx < 0) throw new Error(`Target not found: ${targetRef}`);
    if (op.path) {
      dataArray[idx][op.path] = op.value;
    } else {
      dataArray[idx] = { ...dataArray[idx], ...op.value };
    }
  } else if (op.op === "rename") {
    const idx = findIndexByRef(dataArray, kind, op.from);
    if (idx < 0) throw new Error(`Target not found: ${op.from}`);
    dataArray[idx].id = op.to;
  } else if (op.op === "deprecate") {
    const idx = findIndexByRef(dataArray, kind, targetRef);
    if (idx < 0) throw new Error(`Target not found: ${targetRef}`);
    dataArray[idx].state = "deprecated";
  } else if (op.op === "delete_request") {
    // deletion is orchestrated separately
    return;
  } else {
    throw new Error(`Unsupported op: ${op.op}`);
  }
}

function readJsonAt(ssotDir, relPath) {
  return readJson(join(ssotDir, relPath));
}

function writeJsonAt(ssotDir, relPath, data) {
  writeJson(join(ssotDir, relPath), data);
}

function findTemplate(ssotDir, templateId) {
  const templates = readJsonAt(ssotDir, "tenancy/tenant_templates.json");
  return templates.find((t) => t.template_id === templateId) || templates[0];
}

function applyTemplateToTenant(ssotDir, tenantId, template) {
  if (!template) return;
  if (template.entitlements_default && template.entitlements_default.length) {
    const entitlements = readJsonAt(ssotDir, "tenancy/tenant_entitlements.json");
    for (const ent of template.entitlements_default) {
      if (!entitlements.some((e) => e.tenant_id === tenantId && e.entitlement_id === ent)) {
        entitlements.push({ tenant_id: tenantId, entitlement_id: ent, enabled: true });
      }
    }
    writeJsonAt(ssotDir, "tenancy/tenant_entitlements.json", entitlements);
  }
  if (template.feature_flags_default && template.feature_flags_default.length) {
    const flags = readJsonAt(ssotDir, "tenancy/tenant_flags.json");
    for (const f of template.feature_flags_default) {
      if (!flags.some((x) => x.tenant_id === tenantId && x.flag_id === f)) {
        flags.push({ tenant_id: tenantId, flag_id: f, enabled: true });
      }
    }
    writeJsonAt(ssotDir, "tenancy/tenant_flags.json", flags);
  }
  if (template.module_activations_default && template.module_activations_default.length) {
    const activations = readJsonAt(ssotDir, "modules/module_activations.json");
    for (const m of template.module_activations_default) {
      if (!activations.some((a) => a.tenant_id === tenantId && a.module_id === m.module_id)) {
        activations.push({ tenant_id: tenantId, module_id: m.module_id, state: m.state || "active" });
      }
    }
    writeJsonAt(ssotDir, "modules/module_activations.json", activations);
  }
  if (template.quotas_overrides) {
    const quotas = readJsonAt(ssotDir, "tenancy/tenant_quotas.json");
    quotas.push({ tenant_id: tenantId, quotas: template.quotas_overrides });
    writeJsonAt(ssotDir, "tenancy/tenant_quotas.json", quotas);
  }
  if (template.integrations_profile?.connectors_disabled) {
    const connectors = readJsonAt(ssotDir, "integrations/connectors.json");
    const connectorVersions = readJsonAt(ssotDir, "integrations/connector_versions.json");
    const configs = readJsonAt(ssotDir, "integrations/connector_configs.json");
    for (const c of connectors) {
      const v = connectorVersions.find((cv) => cv.connector_id === c.connector_id) || connectorVersions[0];
      const exists = configs.some((cc) => cc.tenant_id === tenantId && cc.connector_id === c.connector_id);
      if (!exists && v) {
        configs.push({ config_id: `cfg:${tenantId}:${c.connector_id}`, tenant_id: tenantId, connector_id: c.connector_id, version: v.version, state: "disabled" });
      }
    }
    writeJsonAt(ssotDir, "integrations/connector_configs.json", configs);
  }
}

function applyTenantCreate(ssotDir, op) {
  const plan = op.value || {};
  const tenantId = plan.tenant_id;
  const template = findTemplate(ssotDir, plan.template_id);
  const tenants = readJsonAt(ssotDir, "tenancy/tenants.json");
  if (tenants.some((t) => t.tenant_id === tenantId)) throw new Error(`Tenant exists: ${tenantId}`);
  tenants.push({ tenant_id: tenantId, name: plan.display_name || plan.tenant_key, status: "active", plan_id: plan.base_plan_id || template?.base_plan_id || "plan:free" });
  writeJsonAt(ssotDir, "tenancy/tenants.json", tenants);
  if (plan.base_plan_id || template?.base_plan_id) {
    const overrides = readJsonAt(ssotDir, "tenancy/tenant_overrides.json");
    overrides.push({ tenant_id: tenantId, plan_id: plan.base_plan_id || template?.base_plan_id || "plan:free", effective_from: new Date().toISOString() });
    writeJsonAt(ssotDir, "tenancy/tenant_overrides.json", overrides);
  }
  applyTemplateToTenant(ssotDir, tenantId, template);
}

function applyTenantClone(ssotDir, op) {
  const plan = op.value || {};
  const srcId = plan.source_tenant_id;
  const tenantId = plan.tenant_id;
  const tenants = readJsonAt(ssotDir, "tenancy/tenants.json");
  const source = tenants.find((t) => t.tenant_id === srcId);
  if (!source) throw new Error(`Source tenant missing: ${srcId}`);
  if (tenants.some((t) => t.tenant_id === tenantId)) throw new Error(`Tenant exists: ${tenantId}`);
  tenants.push({ tenant_id: tenantId, name: plan.display_name || plan.tenant_key, status: "active", plan_id: source.plan_id });
  writeJsonAt(ssotDir, "tenancy/tenants.json", tenants);

  const overrides = readJsonAt(ssotDir, "tenancy/tenant_overrides.json");
  for (const o of overrides.filter((x) => x.tenant_id === srcId)) {
    overrides.push({ ...o, tenant_id: tenantId });
  }
  writeJsonAt(ssotDir, "tenancy/tenant_overrides.json", overrides);

  const entitlements = readJsonAt(ssotDir, "tenancy/tenant_entitlements.json");
  for (const e of entitlements.filter((x) => x.tenant_id === srcId)) entitlements.push({ ...e, tenant_id: tenantId });
  writeJsonAt(ssotDir, "tenancy/tenant_entitlements.json", entitlements);

  const flags = readJsonAt(ssotDir, "tenancy/tenant_flags.json");
  for (const f of flags.filter((x) => x.tenant_id === srcId)) flags.push({ ...f, tenant_id: tenantId });
  writeJsonAt(ssotDir, "tenancy/tenant_flags.json", flags);

  const quotas = readJsonAt(ssotDir, "tenancy/tenant_quotas.json");
  for (const q of quotas.filter((x) => x.tenant_id === srcId)) quotas.push({ ...q, tenant_id: tenantId });
  writeJsonAt(ssotDir, "tenancy/tenant_quotas.json", quotas);

  const configs = readJsonAt(ssotDir, "integrations/connector_configs.json");
  for (const c of configs.filter((x) => x.tenant_id === srcId)) {
    configs.push({ ...c, tenant_id: tenantId, config_id: `cfg:${tenantId}:${c.connector_id}` });
  }
  writeJsonAt(ssotDir, "integrations/connector_configs.json", configs);
}

function applyTenantBootstrap(ssotDir, op) {
  const tenantId = op.target?.ref;
  const template = findTemplate(ssotDir, op.value?.template_id);
  applyTemplateToTenant(ssotDir, tenantId, template);
}

function readChangeset(changesetId) {
  const direct = join(SSOT_DIR, `changes/changesets/${changesetId}.json`);
  const legacy = join(SSOT_DIR, `changes/changesets/${changesetId}/changeset.json`);
  const path = existsSync(direct) ? direct : legacy;
  return { path, data: readJson(path) };
}

function appendAudit(entry) {
  const ledger = existsSync(AUDIT_PATH) ? readJson(AUDIT_PATH) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeJson(AUDIT_PATH, ledger);
}

export function applyOpsToDir(ssotDir, ops) {
  for (const op of ops || []) {
    if (op.op === "tenant.create") {
      applyTenantCreate(ssotDir, op);
      continue;
    }
    if (op.op === "tenant.clone") {
      applyTenantClone(ssotDir, op);
      continue;
    }
    if (op.op === "tenant.bootstrap.apply-template") {
      applyTenantBootstrap(ssotDir, op);
      continue;
    }
    const relPath = kindToPath[op.target.kind];
    if (!relPath) throw new Error(`Unsupported kind: ${op.target.kind}`);
    const absPath = join(ssotDir, relPath);
    const data = readJson(absPath);

    const expectedExists = op.preconditions?.expected_exists;
    if (expectedExists === false && data.some((x) => itemKey(op.target.kind, x) === op.target.ref)) {
      throw new Error(`Target already exists: ${op.target.ref}`);
    }
    if (op.preconditions?.expected_version) {
      const item = data.find((x) => itemKey(op.target.kind, x) === op.target.ref);
      if (!item || item.version !== op.preconditions.expected_version) {
        throw new Error(`Version mismatch for ${op.target.ref}`);
      }
    }

    applyOp(data, op);
    const schemaId = kindToSchema[op.target.kind];
    if (Array.isArray(data)) {
      if (schemaId === "array_of_objects.v1") validateOrThrow(schemaId, data, relPath);
      else for (const item of data) validateOrThrow(schemaId, item, relPath);
    } else {
      validateOrThrow(schemaId, data, relPath);
    }
    writeJson(absPath, data);
  }
}

export function applyChangeset(changesetId) {
  const { path: csPath, data: cs } = readChangeset(changesetId);
  if (cs.status !== "draft") throw new Error("Only draft changesets can be applied");

  acquireLock();
  let snapshotPath = "";
  try {
    snapshotPath = snapshot(`preapply-${changesetId}`);
    for (const op of cs.ops || []) {
      if (op.op === "tenant.create") {
        applyTenantCreate(SSOT_DIR, op);
        continue;
      }
      if (op.op === "tenant.clone") {
        applyTenantClone(SSOT_DIR, op);
        continue;
      }
      if (op.op === "tenant.bootstrap.apply-template") {
        applyTenantBootstrap(SSOT_DIR, op);
        continue;
      }
      const relPath = kindToPath[op.target.kind];
      if (!relPath) throw new Error(`Unsupported kind: ${op.target.kind}`);
      const absPath = join(SSOT_DIR, relPath);
      const data = readJson(absPath);

      const expectedExists = op.preconditions?.expected_exists;
      const checksum = checksumFile(absPath);
      if (op.preconditions?.expected_checksum && op.preconditions.expected_checksum !== checksum) {
        throw new Error(`Checksum mismatch for ${relPath}`);
      }
      if (op.preconditions?.expected_version) {
        const item = data.find((x) => itemKey(op.target.kind, x) === op.target.ref);
        if (!item || item.version !== op.preconditions.expected_version) {
          throw new Error(`Version mismatch for ${op.target.ref}`);
        }
      }
      if (expectedExists === false && data.some((x) => itemKey(op.target.kind, x) === op.target.ref)) {
        throw new Error(`Target already exists: ${op.target.ref}`);
      }

      applyOp(data, op);

      const schemaId = kindToSchema[op.target.kind];
      if (Array.isArray(data)) {
        if (schemaId === "array_of_objects.v1") validateOrThrow(schemaId, data, relPath);
        else for (const item of data) validateOrThrow(schemaId, item, relPath);
      } else {
        validateOrThrow(schemaId, data, relPath);
      }

      const stagingPath = absPath + ".staging";
      writeJson(stagingPath, data);
      renameSync(stagingPath, absPath);
    }

    cs.status = "applied";
    cs.applied_at = new Date().toISOString();
    cs.snapshot_ref = snapshotPath;
    writeJson(csPath, cs);
    const reviewPath = join(SSOT_DIR, `changes/reviews/${cs.id}.json`);
    if (!existsSync(reviewPath)) {
      writeJson(reviewPath, { id: cs.id, status: "pending", created_at: cs.applied_at });
    }
    appendAudit({ event: "changeset_applied", changeset_id: cs.id, at: cs.applied_at });
    return cs;
  } catch (err) {
    if (snapshotPath) copyDir(snapshotPath, SSOT_DIR);
    throw err;
  } finally {
    releaseLock();
  }
}
