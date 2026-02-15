import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot, waitForServer, getS2SToken } from "./test-utils.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const runtimeDir = join(dirname(ssotDir), "runtime");
mkdirSync(runtimeDir, { recursive: true });

const server = spawn("node", ["apps/backend-api/server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, RUNTIME_DIR: runtimeDir, S2S_CI_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
});

async function run() {
  await waitForServer("http://localhost:7070/api/billing/mode");
  const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:ci", secret: "dummy", scopes: ["billing.*"] });
  const authHeaders = { authorization: `Bearer ${token}` };
  const res = await fetch("http://localhost:7070/api/billing/providers/provider:stripe/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
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
