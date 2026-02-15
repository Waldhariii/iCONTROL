import { execSync, spawn } from "child_process";
import { join, dirname } from "path";
import { mkdirSync, readdirSync } from "fs";
import { createTempSsot, waitForServer, getReportsDir } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const runtimeDir = join(dirname(ssotDir), "runtime");
const manifestsDir = join(runtimeDir, "manifests");
mkdirSync(manifestsDir, { recursive: true });

const server = spawn("node", ["apps/backend-api/server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, RUNTIME_DIR: runtimeDir, MANIFESTS_DIR: manifestsDir, S2S_CI_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
});

try {
  execSync("node scripts/ci/compile.mjs dev-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: manifestsDir } });
  await waitForServer("http://localhost:7070/api/runtime/active-release", 8000);
  execSync("node scripts/maintenance/run-runbook.mjs --runbook rb-promote-pack", {
    stdio: "inherit",
    env: { ...process.env, S2S_CI_HMAC: "dummy" }
  });
  const reports = readdirSync(getReportsDir()).filter((f) => f.startsWith("RUNBOOK_rb-promote-pack"));
  if (!reports.length) throw new Error("Runbook report missing");
  console.log("Runbook promote pack PASS");
} finally {
  server.kill();
  temp.cleanup();
}
