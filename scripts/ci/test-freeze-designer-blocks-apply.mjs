/**
 * Phase AB: freeze blocks apply/publish — temp SSOT with change_freeze enabled (content_mutations), call publish, expect 423/403.
 */
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";

function __icParseBoundLine(line) {
  const m = String(line || "").match(/__IC_BOUND__=(\{.*\})/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const freezePath = join(temp.ssotDir, "governance", "change_freeze.json");
  const freeze = JSON.parse(readFileSync(freezePath, "utf-8"));
  freeze.enabled = true;
  freeze.scopes = { content_mutations: true, studio_ui_mutations: true };
  freeze.allow_actions = freeze.allow_actions || ["breakglass.*", "audit.read"];
  writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: ["ignore", "pipe", "inherit"],
    env: {
      ...process.env,
      SSOT_DIR: temp.ssotDir,
      S2S_CP_HMAC: "dummy",
      S2S_TOKEN_SIGN: "dummy",
      CI: "true",
      HOST: "127.0.0.1",
      PORT: "0"
    }
  });

  let baseUrl = "";
  const chunks = [];
  server.stdout.on("data", (chunk) => chunks.push(chunk));
  const deadline = Date.now() + 10000;
  while (!baseUrl && Date.now() < deadline) {
    await sleep(50);
    const out = Buffer.concat(chunks).toString("utf-8");
    for (const line of out.split(/\r?\n/)) {
      const bound = __icParseBoundLine(line);
      if (bound) {
        baseUrl = `http://${bound.host || "127.0.0.1"}:${bound.port || 7070}`;
        break;
      }
    }
  }
  if (!baseUrl) baseUrl = "http://127.0.0.1:7070";
  const api = `${baseUrl}/api`;
  await sleep(200);

  try {
    const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
    const authHeaders = { "Content-Type": "application/json", authorization: `Bearer ${token}` };

    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: authHeaders }).then((r) => r.json());

    const res = await fetch(`${api}/changesets/${cs.id}/publish`, { method: "POST", headers: authHeaders });
    const body = await res.json().catch(() => ({}));

    if (res.status !== 423 && res.status !== 403) {
      throw new Error(`Expected 423 or 403 when freeze blocks publish, got ${res.status}`);
    }
    if (body.code !== "freeze" && !String(body.error || "").toLowerCase().includes("freeze")) {
      throw new Error(`Expected freeze message in response: ${JSON.stringify(body)}`);
    }

    const auditPath = join(temp.ssotDir, "governance", "audit_ledger.json");
    if (existsSync(auditPath)) {
      const ledger = JSON.parse(readFileSync(auditPath, "utf-8"));
      const freezeBlocked = Array.isArray(ledger) && ledger.some((e) => e.event === "freeze_blocked_publish");
      if (!freezeBlocked) {
        console.warn("Warning: audit event freeze_blocked_publish not found in ledger");
      }
    }

    console.log("Freeze designer blocks apply PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
