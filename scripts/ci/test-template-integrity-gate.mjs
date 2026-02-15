import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const root = join(ssotDir, "..", "..");
const manifestsDir = join(root, "runtime", "manifests");

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}
function writeJson(p, data) {
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

try {
  mkdirSync(manifestsDir, { recursive: true });
  const templatesPath = join(ssotDir, "tenancy", "tenant_templates.json");
  const templates = readJson(templatesPath);
  templates.push({
    template_id: "tmpl:free-with-pro",
    name: "Free With Pro",
    version: "1.0.0",
    base_plan_id: "plan:free",
    entitlements_default: [],
    feature_flags_default: [],
    module_activations_default: [
      { module_id: "module:billing", state: "active" }
    ],
    surface_bootstrap: { cp: { enabled: false }, client: { enabled: false } },
    theme_binding: null,
    quotas_overrides: null,
    datagov_profile: null,
    integrations_profile: { connectors_disabled: true },
    ops_profile: { severity_threshold: "sev2" }
  });
  writeJson(templatesPath, templates);

  execSync("node scripts/ci/compile.mjs test-tpl-001 dev", {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: manifestsDir }
  });

  let output = "";
  try {
    execSync("node governance/gates/run-gates.mjs test-tpl-001", {
      stdio: "pipe",
      env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: manifestsDir }
    });
  } catch (err) {
    output = `${err.stdout || ""}${err.stderr || ""}`;
  }
  if (!output) throw new Error("Expected TemplateIntegrityGate failure did not occur");
  if (!output.includes("Template Integrity Gate")) throw new Error("Missing gate name in output");
  if (!output.includes("tmpl:free-with-pro")) throw new Error("Missing template_id in output");
  if (!output.includes("plan:free")) throw new Error("Missing plan in output");
  if (!output.includes("module:billing")) throw new Error("Missing module in output");
  if (!output.includes("pro")) throw new Error("Missing min_tier in output");

  console.log("Template integrity gate PASS");
} finally {
  temp.cleanup();
}
