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
    const res = await fetch(`${api}/ops/incidents`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ severity_id: "sev1", scope: "platform:*", title: "critical incident" })
    });
    if (!res.ok) throw new Error("Expected incident creation");
    const incident = await res.json();

    const applyRes = await fetch(`${api}/ops/incidents/${incident.id}/runbooks/rb-rollback-active/apply`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" }
    });
    if (applyRes.ok) throw new Error("Expected quorum failure for critical action");

    console.log("Ops runbook quorum required PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
