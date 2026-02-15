import { spawn } from "child_process";
import { createTempSsot, waitForServer } from "./test-utils.mjs";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const pvPath = join(temp.ssotDir, "tenancy", "plan_versions.json");
  const pv = JSON.parse(readFileSync(pvPath, "utf-8"));
  pv[0].rate_limits.concurrent_ops = 1;
  pv[0].rate_limits.rps = 100;
  pv[0].rate_limits.burst = 100;
  writeFileSync(pvPath, JSON.stringify(pv, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await waitForServer(`${api}/runtime/active-release`, 8000);

  try {
    const reqs = [
      fetch(`${api}/releases`, { headers: { "x-user-id": "user:admin", "x-tenant-id": "tenant:default", "x-scope": "platform:*", "x-qos-sleep-ms": "200" } }),
      fetch(`${api}/releases`, { headers: { "x-user-id": "user:admin", "x-tenant-id": "tenant:default", "x-scope": "platform:*", "x-qos-sleep-ms": "200" } })
    ];
    const res = await Promise.all(reqs);
    const limited = res.filter((r) => r.status === 429).length;
    if (limited === 0) throw new Error("Expected concurrency limiting");
    console.log("QoS concurrency PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
