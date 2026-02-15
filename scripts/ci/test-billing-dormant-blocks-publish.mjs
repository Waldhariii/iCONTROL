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
  const compute = await fetch("http://localhost:7070/api/billing/invoices/compute?tenant=tenant:default&period=20260215", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }).then((r) => r.json());
  if (!compute.ok) throw new Error("Compute invoice failed");
  const publish = await fetch("http://localhost:7070/api/billing/invoices/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice: compute.invoice })
  });
  if (publish.status === 200) throw new Error("Publish should be blocked in dormant mode");
  console.log("Billing dormant publish block PASS");
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
