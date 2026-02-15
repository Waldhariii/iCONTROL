import { spawn, execSync } from "child_process";
import { createTempSsot, waitForServer, getReportsDir } from "./test-utils.mjs";
import { join } from "path";
import { readdirSync, statSync } from "fs";

const api = "http://localhost:7070/api";

function latestDir(base) {
  const dirs = readdirSync(base).map((d) => ({ d, t: statSync(join(base, d)).mtimeMs })).sort((a, b) => b.t - a.t);
  return dirs[0]?.d || "";
}

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
      body: JSON.stringify({ severity_id: "sev2", scope: "platform:*", title: "evidence incident" })
    });
    if (!res.ok) throw new Error("Expected incident creation");
    const incident = await res.json();

    const execRes = await fetch(`${api}/ops/incidents/${incident.id}/runbooks/rb-qos-throttle/execute`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "user:admin" }
    });
    if (!execRes.ok) throw new Error("Expected dry-run execution");

    execSync("node scripts/maintenance/generate-evidence-pack.mjs", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });

    const evidenceRoot = join(getReportsDir(), "evidence");
    const latest = latestDir(evidenceRoot);
    if (!latest) throw new Error("Evidence pack missing");
    const files = readdirSync(join(evidenceRoot, latest));
    const hasIncident = files.some((f) => f.startsWith("incident-"));
    const hasTimeline = files.some((f) => f.startsWith("timeline-"));
    if (!hasIncident || !hasTimeline) throw new Error("Evidence pack missing ops artifacts");

    console.log("Ops evidence pack PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
