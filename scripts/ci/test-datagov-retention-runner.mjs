import { spawn, execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const runtimeDir = join(temp.ssotDir, "..", "runtime");
  mkdirSync(runtimeDir, { recursive: true });
  const outDir = join(runtimeDir, "manifests");
  mkdirSync(outDir, { recursive: true });
  const releaseId = "dgrun-001";
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });
  const activePath = join(temp.ssotDir, "changes", "active_release.json");
  writeFileSync(activePath, JSON.stringify({ active_release_id: releaseId, active_env: "dev", updated_at: new Date().toISOString(), updated_by: "test" }, null, 2) + "\n");
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, RUNTIME_DIR: runtimeDir, MANIFESTS_DIR: outDir } });
  await sleep(500);

  try {
    await fetch(`${api}/data/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin", "x-scope": "platform:*" },
      body: JSON.stringify({ tenant_id: "tenant:default", model_id: "model:document" })
    });

    execSync("node scripts/maintenance/run-retention.mjs", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, RUNTIME_DIR: runtimeDir, MANIFESTS_DIR: outDir } });
    console.log("Data governance retention runner PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
