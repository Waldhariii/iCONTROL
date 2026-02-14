import { spawn } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await sleep(500);

  try {
    // deny unknown user
    const res1 = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-user-id": "user:unknown" } });
    if (res1.ok) throw new Error("Expected deny for unknown user");

    // deny tenant-scope leakage
    const res2 = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-user-id": "user:admin", "x-tenant-id": "tenant-1" } });
    if (res2.ok) throw new Error("Expected deny for tenant-scope leakage");

    // allow platform admin
    const res3 = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-user-id": "user:admin" } });
    if (!res3.ok) throw new Error("Expected allow for platform admin");

    console.log("Governance authz PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
