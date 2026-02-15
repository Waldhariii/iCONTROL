import { spawn } from "child_process";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  await sleep(500);

  try {
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["studio.*", "release.*"] });
    const authHeaders = { authorization: `Bearer ${token}` };
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: authHeaders }).then((r) => r.json());
    const reviewsDir = join(temp.ssotDir, "changes/reviews");
    mkdirSync(reviewsDir, { recursive: true });
    writeFileSync(join(reviewsDir, `publish-${cs.id}.json`), JSON.stringify({ id: `publish-${cs.id}`, action: "publish", target_id: cs.id, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));
    const published = await fetch(`${api}/changesets/${cs.id}/publish`, { method: "POST", headers: authHeaders }).then((r) => r.json());
    const releaseId = published.release_id;

    writeFileSync(join(reviewsDir, `activate-${releaseId}.json`), JSON.stringify({ id: `activate-${releaseId}`, action: "activate", target_id: releaseId, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));

    await fetch(`${api}/releases/${releaseId}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ env: "dev" })
    });

    const active = JSON.parse(readFileSync(`${temp.ssotDir}/changes/active_release.json`, "utf-8"));
    if (active.active_release_id !== releaseId) throw new Error("Active release not updated");

    const before = readFileSync(`${temp.ssotDir}/changes/active_release.json`, "utf-8");
    const csPreview = await fetch(`${api}/changesets`, { method: "POST", headers: authHeaders }).then((r) => r.json());
    const preview = await fetch(`${api}/changesets/${csPreview.id}/preview`, { method: "POST", headers: authHeaders }).then((r) => r.json());
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
