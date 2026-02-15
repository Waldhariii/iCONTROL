/**
 * Phase AC: temp SSOT + changeset adding widget with action(kind=export_pdf, policy_id) then run gates; expect ActionPolicyGate PASS.
 */
import { execSync } from "child_process";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const CS_ID = "cs-pdf-export-test";
const temp = createTempSsot();
const ssotDir = temp.ssotDir;

// Strip AC modules that declare workflows not present in temp SSOT so Domain Isolation Gate passes; we only assert ActionPolicyGate.
const MODULES_WITH_MISSING_WORKFLOWS = ["module:pdf_exports", "module:ocr_pipeline", "module:accounting_sync"];
const modulesPath = join(ssotDir, "modules", "domain_modules.json");
const versionsPath = join(ssotDir, "modules", "domain_module_versions.json");
const modules = JSON.parse(readFileSync(modulesPath, "utf-8"));
const versions = JSON.parse(readFileSync(versionsPath, "utf-8"));
const filteredModules = modules.filter((m) => !MODULES_WITH_MISSING_WORKFLOWS.includes(m.module_id));
const filteredVersions = versions.filter((v) => !MODULES_WITH_MISSING_WORKFLOWS.includes(v.module_id));
writeFileSync(modulesPath, JSON.stringify(filteredModules, null, 2) + "\n");
writeFileSync(versionsPath, JSON.stringify(filteredVersions, null, 2) + "\n");
const outDir = join(dirname(dirname(ssotDir)), "runtime", "manifests");
mkdirSync(outDir, { recursive: true });

const changesetDir = join(ssotDir, "changes", "changesets");
mkdirSync(changesetDir, { recursive: true });
const changesetPath = join(changesetDir, `${CS_ID}.json`);

const changeset = {
  id: CS_ID,
  status: "draft",
  created_by: "ci",
  created_at: new Date().toISOString(),
  scope: "global",
  ops: [
    {
      op: "add",
      target: { kind: "widget_instance", ref: "wi-pdf-export-test" },
      value: {
        id: "wi-pdf-export-test",
        widget_id: "widget:placeholder",
        props: {},
        props_schema: { allowed_props: [] },
        page_id: "cp-studio-pages",
        module_id: "studio",
        section_key: "__default",
        data_bindings: [],
        actions: [{ action_id: "a1", kind: "export_pdf", policy_id: "policy:default" }]
      },
      preconditions: { expected_exists: false }
    },
    {
      op: "update",
      target: { kind: "page_version", ref: "cp-studio-pages" },
      value: { widget_instance_ids: ["wi-pdf-export-test"] }
    }
  ]
};
writeFileSync(changesetPath, JSON.stringify(changeset, null, 2) + "\n");

execSync("node scripts/ci/apply-changeset.mjs " + CS_ID, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir }
});

execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

execSync("node governance/gates/run-gates.mjs dev-001", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

console.log("PDF export action policy (ActionPolicyGate) PASS");
temp.cleanup();
