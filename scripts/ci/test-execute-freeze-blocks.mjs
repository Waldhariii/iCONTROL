/**
 * Phase AH: When change freeze is enabled and scopes.content_mutations, execute mode returns 423.
 */
import { spawn } from "child_process";
import { readFileSync, existsSync, writeFileSync } from "fs";
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
  const freeze = existsSync(freezePath) ? JSON.parse(readFileSync(freezePath, "utf-8")) : {};
  freeze.enabled = true;
  freeze.scopes = freeze.scopes || {};
  freeze.scopes.content_mutations = true;
  freeze.allow_actions = freeze.allow_actions || [];
  if (!freeze.allow_actions.includes("studio.pages.view")) freeze.allow_actions.push("studio.pages.view");
  freeze.enabled_at = new Date().toISOString();
  freeze.enabled_by = "ci";
  writeFileSync(freezePath, JSON.stringify(freeze, null, 2), "utf-8");

  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: ["ignore", "pipe", "inherit"],
    cwd: process.cwd(),
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

  const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
  const authHeaders = { authorization: `Bearer ${token}` };

  const res = await fetch(`${api}/studio/workflows/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      workflow_id: "workflow:pdf_export_invoice",
      mode: "execute"
    })
  });
  server.kill("SIGTERM");
  temp.cleanup();

  if (res.status !== 423) throw new Error(`expected 423 when freeze+content_mutations, got ${res.status}`);
  const payload = await res.json();
  if (payload.code !== "freeze") throw new Error(`expected code freeze, got ${payload.code}`);
  console.log("Execute freeze blocks PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
