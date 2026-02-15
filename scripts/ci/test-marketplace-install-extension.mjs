import { spawn, execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

function writeReview(ssotDir, action, targetId) {
  const safe = action.replace(/[^a-z0-9-]/gi, "_");
  const path = join(ssotDir, "changes", "reviews", `${safe}-${targetId}.json`);
  mkdirSync(join(ssotDir, "changes", "reviews"), { recursive: true });
  writeFileSync(path, JSON.stringify({ id: `${safe}-${targetId}`, action, target_id: targetId, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const releaseId = "mp-ext-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});
writeFileSync(
  join(ssotDir, "changes", "active_release.json"),
  JSON.stringify({ active_release_id: releaseId, active_env: "dev", updated_at: new Date().toISOString(), updated_by: "test" }, null, 2) + "\n"
);

const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir } });

async function run() {
  await sleep(500);
  writeReview(ssotDir, "extension_install", "cs-ext-install");
  const res = await fetch("http://localhost:7070/api/marketplace/tenants/tenant:default/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "extension", id: "ext:sample", version: "1.0.0", changeset_id: "cs-ext-install" })
  }).then((r) => r.json());
  if (!res.ok) throw new Error("Marketplace extension install failed");
  const manifest = await fetch("http://localhost:7070/api/runtime/manifest").then((r) => r.json());
  const exts = manifest.extensions_runtime || [];
  const ok = exts.some((e) => e.extension_id === "ext:sample");
  if (!ok) throw new Error("Extension not present after install");
  console.log("Marketplace install extension PASS");
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
    temp.cleanup();
  });
