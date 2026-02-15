import { spawn } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
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
  pv[0].budgets.cost_units_per_day = 5;
  pv[0].rate_limits.rps = 100;
  pv[0].rate_limits.burst = 100;
  writeFileSync(pvPath, JSON.stringify(pv, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await sleep(500);

  try {
    const h = { "x-user-id": "user:admin", "x-tenant-id": "tenant:default", "x-scope": "platform:*", "x-action-type": "api.write" };
    const r1 = await fetch(`${api}/releases`, { headers: h });
    if (!r1.ok) throw new Error(`Expected first request ok, got ${r1.status}: ${await r1.text()}`);
    const r2 = await fetch(`${api}/releases`, { headers: h });
    if (!r2.ok) throw new Error(`Expected second request ok, got ${r2.status}: ${await r2.text()}`);
    const r3 = await fetch(`${api}/releases`, { headers: h });
    if (r3.status !== 429) throw new Error("Expected budget limit");
    console.log("QoS budgets PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
