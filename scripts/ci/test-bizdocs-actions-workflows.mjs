/**
 * Phase AD: temp SSOT with widget_instances having actions export_pdf + call_workflow (policy_id=policy:default); run-gates, assert ActionPolicyGate PASS.
 */
import { execSync } from "child_process";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(dirname(ssotDir)), "runtime", "manifests");
mkdirSync(outDir, { recursive: true });

// Temp SSOT copy already contains bizdocs widget_instances (wi-pdf-export-001, wi-ocr-queue-001, wi-acct-sync-001) with actions + policy_id.
// No injection: avoid orphan widgets; just compile and run-gates to assert ActionPolicyGate PASS.

execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

execSync("node governance/gates/run-gates.mjs dev-001", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

console.log("Bizdocs actions/workflows (ActionPolicyGate) PASS");
temp.cleanup();
