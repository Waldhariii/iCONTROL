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
  const qosPath = join(temp.ssotDir, "qos", "qos_policies.json");
  const qos = JSON.parse(readFileSync(qosPath, "utf-8"));
  const free = qos.find((q) => q.tier === "free");
  if (free) {
    free.shed_on_error_rate_over = 0.1;
    free.grace_windows.breaker_cooldown_s = 2;
  }
  writeFileSync(qosPath, JSON.stringify(qos, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await waitForServer(`${api}/runtime/active-release`, 8000);

  try {
    for (let i = 0; i < 25; i++) {
      await fetch(`${api}/qos/test-error`, { headers: { "x-user-id": "user:admin", "x-tenant-id": "tenant:default", "x-scope": "platform:*" } });
    }
    const res = await fetch(`${api}/releases`, { headers: { "x-user-id": "user:admin", "x-tenant-id": "tenant:default", "x-scope": "platform:*" } });
    if (res.status !== 503) throw new Error("Expected circuit breaker to open");
    console.log("QoS circuit breaker PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
