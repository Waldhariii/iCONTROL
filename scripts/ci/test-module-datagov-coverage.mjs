import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const fieldsPath = join(ssotDir, "data", "catalog", "data_fields.json");
const fields = JSON.parse(readFileSync(fieldsPath, "utf-8"));
const target = fields.find((f) => f.field_id === "field:job.customer_name");
if (target) target.classification_id = "unknown";
writeFileSync(fieldsPath, JSON.stringify(fields, null, 2) + "\n");

const releaseId = "mod-dg-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

let failed = false;
try {
  execSync(`node governance/gates/run-gates.mjs ${releaseId}`, {
    stdio: "ignore",
    env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
  });
} catch {
  failed = true;
}
if (!failed) throw new Error("DataGovCoverageGate should fail when classification missing");
console.log("Module DataGov coverage gate FAIL expected PASS");

temp.cleanup();
