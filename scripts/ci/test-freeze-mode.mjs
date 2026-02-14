import { spawn, execSync } from "child_process";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeJson(path, data) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

async function run() {
  const temp = createTempSsot();
  const freezePath = join(temp.ssotDir, "governance", "change_freeze.json");
  const freeze = JSON.parse(readFileSync(freezePath, "utf-8"));
  freeze.enabled = true;
  freeze.allow_actions = [
    "governance.*",
    "studio.releases.activate",
    "studio.releases.rollback",
    "breakglass.*",
    "audit.read",
    "observability.read"
  ];
  writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await sleep(500);

  try {
    const res1 = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-user-id": "user:admin" } });
    if (res1.ok) throw new Error("Expected deny for studio changeset during freeze");

    const reviewsDir = join(temp.ssotDir, "changes", "reviews");
    mkdirSync(reviewsDir, { recursive: true });
    writeJson(join(reviewsDir, "activate-dev-001.json"), {
      id: "activate-dev-001",
      action: "activate",
      target_id: "dev-001",
      required_approvals: 2,
      approvals: ["user:admin", "user:admin2"],
      status: "approved"
    });
    writeJson(join(reviewsDir, "rollback-dev-001.json"), {
      id: "rollback-dev-001",
      action: "rollback",
      target_id: "dev-001",
      required_approvals: 2,
      approvals: ["user:admin", "user:admin2"],
      status: "approved"
    });

    const res2 = await fetch(`${api}/releases/dev-001/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ env: "dev" })
    });
    if (!res2.ok) throw new Error("Expected allow for activate during freeze");

    const res3 = await fetch(`${api}/releases/dev-001/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin" }
    });
    if (!res3.ok) throw new Error("Expected allow for rollback during freeze");

    const res4 = await fetch(`${api}/governance/break-glass/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin" },
      body: JSON.stringify({ reason: "freeze-test", allowed_actions: ["studio.pages.edit"] })
    });
    if (!res4.ok) throw new Error("Expected allow for break-glass request during freeze");

    const res5 = await fetch(`${api}/governance/break-glass/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin2" },
      body: JSON.stringify({ user_id: "user:admin2" })
    });
    if (!res5.ok) throw new Error("Expected allow for break-glass approve during freeze");

    const csDir = join(temp.ssotDir, "changes", "changesets");
    mkdirSync(csDir, { recursive: true });
    writeJson(join(csDir, "cs-freeze-001.json"), {
      id: "cs-freeze-001",
      status: "draft",
      created_by: "test",
      created_at: new Date().toISOString(),
      scope: "global",
      ops: [
        {
          op: "add",
          target: { kind: "page_definition", ref: "page:test-freeze" },
          value: { id: "page:test-freeze" }
        }
      ]
    });

    execSync("node scripts/ci/compile.mjs freeze-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
    let freezeFailed = false;
    try {
      execSync("node governance/gates/run-gates.mjs freeze-001", { stdio: "ignore", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
    } catch {
      freezeFailed = true;
    }
    if (!freezeFailed) throw new Error("Expected Freeze Gate to fail for frozen changeset ops");

    console.log("Freeze mode PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
