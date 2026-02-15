import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot, waitForServer } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const runtimeDir = join(dirname(ssotDir), "runtime");
mkdirSync(runtimeDir, { recursive: true });

const server = spawn("node", ["apps/backend-api/server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, RUNTIME_DIR: runtimeDir }
});

async function run() {
  await waitForServer("http://localhost:7070/api/billing/mode");
  const res = await fetch("http://localhost:7070/api/billing/providers/provider:stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: true })
  });
  if (res.status === 200) throw new Error("Webhook should be disabled in dormant mode");
  console.log("Billing webhook disabled PASS");
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
    temp.cleanup();
  });
