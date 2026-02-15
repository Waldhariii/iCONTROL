import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-finops-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  run("node scripts/ci/compile.mjs finops-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  run("node governance/gates/run-gates.mjs finops-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir });

  // quota gate: non-positive cpu budget
  const pvPath = join(temp.ssotDir, "tenancy", "plan_versions.json");
  const pv = JSON.parse(readFileSync(pvPath, "utf-8"));
  pv[0].compute_budgets.cpu_ms_per_day = 0;
  writeFileSync(pvPath, JSON.stringify(pv, null, 2) + "\n");
  run("node scripts/ci/compile.mjs finops-002 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  let failedQuota = false;
  try {
    run("node governance/gates/run-gates.mjs finops-002", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failedQuota = true;
  }
  if (!failedQuota) throw new Error("Expected Quota Gate failure");

  // plan integrity gate: invalid plan override
  const toPath = join(temp.ssotDir, "tenancy", "tenant_overrides.json");
  const to = JSON.parse(readFileSync(toPath, "utf-8"));
  to.push({ tenant_id: "tenant:bad", plan_id: "plan:missing", effective_from: new Date().toISOString() });
  writeFileSync(toPath, JSON.stringify(to, null, 2) + "\n");
  run("node scripts/ci/compile.mjs finops-003 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  let failedPlan = false;
  try {
    run("node governance/gates/run-gates.mjs finops-003", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failedPlan = true;
  }
  if (!failedPlan) throw new Error("Expected Plan Integrity Gate failure");

  console.log("FinOps gates PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
