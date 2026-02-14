import { spawn } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { writeFileSync, mkdirSync } from "fs";
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
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-user-id": "user:admin" } }).then((r) => r.json());
    const res0 = await fetch(`${api}/changesets/${cs.id}/publish`, { method: "POST", headers: { "x-user-id": "user:admin" } });
    if (res0.ok) throw new Error("Expected publish to be blocked without quorum");

    const reviewsDir = join(temp.ssotDir, "changes/reviews");
    mkdirSync(reviewsDir, { recursive: true });
    writeFileSync(join(reviewsDir, `publish-${cs.id}.json`), JSON.stringify({ id: `publish-${cs.id}`, action: "publish", target_id: cs.id, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));

    const res = await fetch(`${api}/changesets/${cs.id}/publish`, { method: "POST", headers: { "x-user-id": "user:admin" } });
    if (!res.ok) throw new Error("Expected publish to pass with quorum");

    console.log("Quorum PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
