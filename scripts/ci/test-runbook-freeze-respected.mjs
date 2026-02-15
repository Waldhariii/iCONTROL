import { execSync, spawn } from "child_process";
import { join, dirname } from "path";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { createTempSsot, waitForServer } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const runtimeDir = join(dirname(ssotDir), "runtime");
const manifestsDir = join(runtimeDir, "manifests");
mkdirSync(manifestsDir, { recursive: true });

const freezePath = join(ssotDir, "governance", "change_freeze.json");
const freeze = JSON.parse(readFileSync(freezePath, "utf-8"));
freeze.enabled = true;
freeze.enabled_at = new Date().toISOString();
freeze.enabled_by = "ci";
writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");

const server = spawn("node", ["apps/backend-api/server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, RUNTIME_DIR: runtimeDir, MANIFESTS_DIR: manifestsDir, S2S_CI_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
});

try {
  execSync("node scripts/ci/compile.mjs dev-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: manifestsDir } });
  await waitForServer("http://localhost:7070/api/runtime/active-release", 8000);
  let failed = false;
  try {
    execSync("node scripts/maintenance/run-runbook.mjs --runbook rb-tenant-create --apply", {
      stdio: "inherit",
      env: { ...process.env, S2S_CI_HMAC: "dummy" }
    });
  } catch {
    failed = true;
  }
  if (!failed) throw new Error("Expected runbook apply to fail under freeze");
  console.log("Runbook freeze respected PASS");
} finally {
  server.kill();
  temp.cleanup();
}
