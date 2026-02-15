import { spawn, execSync } from "child_process";
import { createTempSsot, waitForServer } from "./test-utils.mjs";
import { join } from "path";

const api = "http://localhost:7070/api";

async function run() {
  const temp = createTempSsot();
  const root = join(temp.ssotDir, "..", "..");
  const manifestsDir = join(root, "runtime", "manifests");
  execSync("node scripts/ci/compile.mjs dev-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: manifestsDir } });

  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: manifestsDir }
  });
  await waitForServer(`${api}/runtime/active-release`);

  try {
    const incidentRes = await fetch(`${api}/ops/incidents`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ severity_id: "sev1", scope: "platform:*", title: "breakglass incident" })
    });
    if (!incidentRes.ok) throw new Error("Expected incident creation");
    const incident = await incidentRes.json();

    const bgReq = await fetch(`${api}/governance/break-glass/request`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ reason: "ops breakglass", scope: "platform:*", allowed_actions: ["release.rollback"], expires_at: new Date(Date.now() + 600000).toISOString() })
    });
    if (!bgReq.ok) throw new Error("Expected break-glass request");

    const bgApprove1 = await fetch(`${api}/governance/break-glass/approve`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ user_id: "user:admin" })
    });
    if (!bgApprove1.ok) throw new Error("Expected break-glass approval 1");

    const bgApprove2 = await fetch(`${api}/governance/break-glass/approve`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin2" },
      body: JSON.stringify({ user_id: "user:admin2" })
    });
    if (!bgApprove2.ok) throw new Error("Expected break-glass approval 2");

    const applyRes = await fetch(`${api}/ops/incidents/${incident.id}/runbooks/rb-rollback-active/apply`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" }
    });
    if (!applyRes.ok) throw new Error("Expected break-glass override to allow apply");

    console.log("Ops break-glass override PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
