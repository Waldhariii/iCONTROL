import { spawn } from "child_process";
import { createTempSsot, waitForServer } from "./test-utils.mjs";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const api = "http://localhost:7070/api";

function enableBreakGlass(ssotDir) {
  const path = join(ssotDir, "governance", "break_glass.json");
  const bg = JSON.parse(readFileSync(path, "utf-8"));
  bg.enabled = true;
  bg.expires_at = new Date(Date.now() + 600000).toISOString();
  bg.allowed_actions = ["ops.tenancy.apply"];
  writeFileSync(path, JSON.stringify(bg, null, 2) + "\n");
}

async function run() {
  const temp = createTempSsot();
  enableBreakGlass(temp.ssotDir);
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await waitForServer(`${api}/runtime/active-release`);

  try {
    const res = await fetch(`${api}/tenancy/factory/apply`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ template_id: "tmpl:default", tenant_key: "audit-tenant", display_name: "Audit Tenant" })
    });
    if (!res.ok) throw new Error("Expected tenant factory apply");
    const ledger = JSON.parse(readFileSync(join(temp.ssotDir, "governance", "audit_ledger.json"), "utf-8"));
    if (!ledger.some((e) => e.event === "tenant_create_applied")) throw new Error("Missing audit entry");
    console.log("Tenant factory audit PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
