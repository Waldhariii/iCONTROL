import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-dgcat-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  const fieldsPath = join(temp.ssotDir, "data", "catalog", "data_fields.json");
  const fields = JSON.parse(readFileSync(fieldsPath, "utf-8"));
  fields.push({ field_id: "field:bad", data_model_id: "model:document", path: "bad", type: "string", classification_id: "missing" });
  writeFileSync(fieldsPath, JSON.stringify(fields, null, 2) + "\n");

  run("node scripts/ci/compile.mjs dgcat-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs dgcat-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected Data Catalog Gate failure");
  console.log("Data governance classification PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
