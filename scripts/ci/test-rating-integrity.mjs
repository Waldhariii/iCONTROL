import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const rulesPath = join(ssotDir, "billing", "rating_rules.json");
const rules = JSON.parse(readFileSync(rulesPath, "utf-8")).filter((r) => r.meter_id !== "meter:requests");
writeFileSync(rulesPath, JSON.stringify(rules, null, 2) + "\n");

execSync("node scripts/ci/compile.mjs rating-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});
let failed = false;
try {
  execSync("node governance/gates/run-gates.mjs rating-001", {
    stdio: "ignore",
    env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
  });
} catch {
  failed = true;
}
if (!failed) throw new Error("Rating integrity gate should fail for missing rule");
console.log("Rating integrity gate PASS");

temp.cleanup();
