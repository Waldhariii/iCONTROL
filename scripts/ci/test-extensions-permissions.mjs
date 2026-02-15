import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function run(cmd, env, stdio = "inherit") {
  execSync(cmd, { stdio, env: { ...process.env, ...env } });
}

const tempRoot = mkdtempSync(join(tmpdir(), "icontrol-extperm-"));
const outDir = join(tempRoot, "manifests");
mkdirSync(outDir, { recursive: true });

const temp = createTempSsot();

try {
  const permPath = join(temp.ssotDir, "extensions", "extension_permissions.json");
  const perms = JSON.parse(readFileSync(permPath, "utf-8"));
  perms[0].requested_capabilities.push("platform.admin");
  writeFileSync(permPath, JSON.stringify(perms, null, 2) + "\n");

  run("node scripts/ci/compile.mjs extperm-001 dev", { SSOT_DIR: temp.ssotDir, OUT_DIR: outDir });
  let failed = false;
  try {
    run("node governance/gates/run-gates.mjs extperm-001", { SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }, "ignore");
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected Extension Permission Gate failure");

  console.log("Extensions permissions PASS");
} finally {
  temp.cleanup();
  rmSync(tempRoot, { recursive: true, force: true });
}
