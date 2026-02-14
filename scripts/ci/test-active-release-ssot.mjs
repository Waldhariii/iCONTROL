import { spawn } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await sleep(500);

  try {
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());
    const reviewsDir = join(temp.ssotDir, "changes/reviews");
    mkdirSync(reviewsDir, { recursive: true });
    writeFileSync(join(reviewsDir, `publish-${cs.id}.json`), JSON.stringify({ id: `publish-${cs.id}`, action: "publish", target_id: cs.id, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));
    const published = await fetch(`${api}/changesets/${cs.id}/publish`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());
    const releaseId = published.release_id;

    writeFileSync(join(reviewsDir, `activate-${releaseId}.json`), JSON.stringify({ id: `activate-${releaseId}`, action: "activate", target_id: releaseId, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));

    await fetch(`${api}/releases/${releaseId}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ env: "dev" })
    });

    const active = JSON.parse(readFileSync(`${temp.ssotDir}/changes/active_release.json`, "utf-8"));
    if (active.active_release_id !== releaseId) throw new Error("Active release not updated");

    const before = readFileSync(`${temp.ssotDir}/changes/active_release.json`, "utf-8");
    const csPreview = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());
    const preview = await fetch(`${api}/changesets/${csPreview.id}/preview`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());
    if (!preview.preview_release) throw new Error("Preview failed");
    const after = readFileSync(`${temp.ssotDir}/changes/active_release.json`, "utf-8");
    if (before !== after) throw new Error("Preview modified active_release.json");

    console.log("Active release SSOT PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
