import { mkdtempSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-scriptcat-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });
const temp = createTempSsot();

try {
  run("node scripts/ci/compile.mjs sc-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  run("node governance/gates/run-gates.mjs sc-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir });
  console.log("Script catalog gate PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
