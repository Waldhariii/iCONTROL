import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-slo-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  const path = join(temp.ssotDir, "sre", "slo_definitions.json");
  const slos = JSON.parse(readFileSync(path, "utf-8"));
  const latency = slos.find((s) => s.slo_id === "slo:api_latency_p95");
  if (latency) delete latency.tier_targets;
  writeFileSync(path, JSON.stringify(slos, null, 2) + "\n");

  run("node scripts/ci/compile.mjs slo-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs slo-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected SLO Gate failure");

  console.log("SLO config gate PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
