import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-dghold-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  const policiesPath = join(temp.ssotDir, "data", "policies", "retention_policies.json");
  const policies = JSON.parse(readFileSync(policiesPath, "utf-8"));
  policies[0].legal_hold = true;
  policies[0].purge_strategy = "delete";
  writeFileSync(policiesPath, JSON.stringify(policies, null, 2) + "\n");

  const fieldsPath = join(temp.ssotDir, "data", "catalog", "data_fields.json");
  const fields = JSON.parse(readFileSync(fieldsPath, "utf-8"));
  fields[0].classification_id = "pii.high";
  writeFileSync(fieldsPath, JSON.stringify(fields, null, 2) + "\n");

  run("node scripts/ci/compile.mjs dghold-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs dghold-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected Retention Policy Gate failure");
  console.log("Data governance legal hold PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
