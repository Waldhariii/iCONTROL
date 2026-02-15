import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-extsig-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  run("node scripts/ci/compile.mjs extsig-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  run("node governance/gates/run-gates.mjs extsig-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir });

  const artifact = join(outDir, "extensions", "ext_sample@1.0.0.signed.json");
  const data = JSON.parse(readFileSync(artifact, "utf-8"));
  data.signature = "";
  writeFileSync(artifact, JSON.stringify(data, null, 2) + "\n");

  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs extsig-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected Extension Signature Gate failure");

  console.log("Extensions signature PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
