import { spawn, execSync } from "child_process";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

function writeReview(ssotDir, action, targetId) {
  const safe = action.replace(/[^a-z0-9-]/gi, "_");
  const path = join(ssotDir, "changes", "reviews", `${safe}-${targetId}.json`);
  mkdirSync(join(ssotDir, "changes", "reviews"), { recursive: true });
  writeFileSync(path, JSON.stringify({ id: `${safe}-${targetId}`, action, target_id: targetId, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const activationsPath = join(ssotDir, "modules", "module_activations.json");
writeFileSync(activationsPath, JSON.stringify([], null, 2) + "\n");

const templatesPath = join(ssotDir, "tenancy", "tenant_templates.json");
const templates = JSON.parse(readFileSync(templatesPath, "utf-8"));
if (!templates.find((t) => t.template_id === "tmpl:marketplace-empty")) {
  templates.push({
    template_id: "tmpl:marketplace-empty",
    name: "Marketplace Empty",
    version: "1.0.0",
    base_plan_id: "plan:free",
    entitlements_default: [],
    feature_flags_default: [],
    module_activations_default: [],
    surface_bootstrap: { cp: { enabled: false }, client: { enabled: false } },
    theme_binding: null,
    quotas_overrides: null,
    datagov_profile: null,
    integrations_profile: { connectors_disabled: true },
    ops_profile: { severity_threshold: "sev2" }
  });
  writeFileSync(templatesPath, JSON.stringify(templates, null, 2) + "\n");
}

const releaseId = "mp-plan-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});
writeFileSync(
  join(ssotDir, "changes", "active_release.json"),
  JSON.stringify({ active_release_id: releaseId, active_env: "dev", updated_at: new Date().toISOString(), updated_by: "test" }, null, 2) + "\n"
);

const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir } });

async function run() {
  await sleep(500);
  writeReview(ssotDir, "tenant_create", "tenant:mpblock");
  const apply = await fetch("http://localhost:7070/api/tenancy/factory/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template_id: "tmpl:marketplace-empty", tenant_key: "mpblock", display_name: "MP Block" })
  }).then((r) => r.json());
  if (!apply.ok) throw new Error("Tenant apply failed");

  const res = await fetch("http://localhost:7070/api/marketplace/tenants/tenant:mpblock/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "module", id: "module:billing", version: "1.0.0" })
  }).then((r) => r.json());
  if (!res.ok) throw new Error("Marketplace plan block install failed");

  const installed = await fetch("http://localhost:7070/api/marketplace/tenants/tenant:mpblock/installed").then((r) => r.json());
  const billing = (installed.modules || []).find((m) => m.module_id === "module:billing");
  if (billing?.state !== "inactive") throw new Error("Paid module should be inactive on free plan");

  const manifest = await fetch("http://localhost:7070/api/runtime/manifest").then((r) => r.json());
  const routes = (manifest.routes?.routes || []).map((r) => r.path);
  if (routes.includes("/billing/invoices")) throw new Error("Paid module routes should not be active");
  console.log("Marketplace plan block PASS");
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
    temp.cleanup();
  });
