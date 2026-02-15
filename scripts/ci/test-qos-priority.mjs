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
  const tenantsPath = join(temp.ssotDir, "tenancy", "tenants.json");
  const tenants = JSON.parse(readFileSync(tenantsPath, "utf-8"));
  tenants.push({ tenant_id: "tenant:pro", name: "Pro", status: "active", plan_id: "plan:pro" });
  writeFileSync(tenantsPath, JSON.stringify(tenants, null, 2) + "\n");

  const qosPath = join(temp.ssotDir, "qos", "qos_policies.json");
  const qos = JSON.parse(readFileSync(qosPath, "utf-8"));
  const free = qos.find((q) => q.tier === "free");
  if (free) free.max_queue_depth.api = 1;
  writeFileSync(qosPath, JSON.stringify(qos, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await waitForServer(`${api}/runtime/active-release`, 8000);

  try {
    const hold = fetch(`${api}/releases`, { headers: { "x-user-id": "user:admin", "x-tenant-id": "tenant:default", "x-scope": "platform:*", "x-qos-sleep-ms": "300" } });
    await sleep(50);
    const pro = await fetch(`${api}/releases`, { headers: { "x-user-id": "user:admin", "x-tenant-id": "tenant:pro", "x-scope": "platform:*" } });
    if (!pro.ok) {
      const body = await pro.text();
      throw new Error(`Expected PRO request to succeed under FREE load, got ${pro.status}: ${body}`);
    }
    await hold;
    console.log("QoS priority PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
