import { spawn } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { readFileSync, writeFileSync } from "fs";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await sleep(500);

  try {
    const reqRes = await fetch(`${api}/governance/break-glass/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ reason: "incident", allowed_actions: ["studio.pages.edit"], expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
    });
    if (!reqRes.ok) throw new Error(`Break-glass request failed: ${await reqRes.text()}`);

    const r1 = await fetch(`${api}/governance/break-glass/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ user_id: "user:admin" })
    });
    const r2 = await fetch(`${api}/governance/break-glass/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin2" },
      body: JSON.stringify({ user_id: "user:admin2" })
    });
    if (!r1.ok) throw new Error(`Break-glass approve failed (1): ${await r1.text()}`);
    if (!r2.ok) throw new Error(`Break-glass approve failed (2): ${await r2.text()}`);

    const bgCheck = JSON.parse(readFileSync(`${temp.ssotDir}/governance/break_glass.json`, "utf-8"));
    if (!bgCheck.enabled) throw new Error("Break-glass not enabled after approvals");

    const allow = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-user-id": "user:unknown" } });
    if (!allow.ok) throw new Error("Expected break-glass to allow action");

    const bgPath = `${temp.ssotDir}/governance/break_glass.json`;
    const bg = JSON.parse(readFileSync(bgPath, "utf-8"));
    bg.expires_at = new Date(Date.now() - 60 * 1000).toISOString();
    writeFileSync(bgPath, JSON.stringify(bg, null, 2));

    const deny = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-user-id": "user:unknown" } });
    if (deny.ok) throw new Error("Expected break-glass to expire and deny");

    console.log("Break-glass PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
