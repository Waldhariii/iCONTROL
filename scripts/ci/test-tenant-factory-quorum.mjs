import { spawn } from "child_process";
import { createTempSsot, waitForServer } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await waitForServer(`${api}/runtime/active-release`);

  try {
    const res = await fetch(`${api}/tenancy/factory/apply`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ template_id: "tmpl:default", tenant_key: "quorum-tenant", display_name: "Quorum Tenant" })
    });
    if (res.ok) throw new Error("Expected quorum failure");
    console.log("Tenant factory quorum PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
