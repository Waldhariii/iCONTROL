/**
 * Phase AG: Control Plane Cockpit smoke — API CI mode (port 0), verify cockpit endpoints 200 + CP assets exist.
 */
import { spawn } from "child_process";
import { existsSync } from "fs";
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
  if (!existsSync("apps/control-plane/index.html")) throw new Error("missing apps/control-plane/index.html");
  if (!existsSync("apps/control-plane/cockpit.js")) throw new Error("missing apps/control-plane/cockpit.js");

  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: ["ignore", "pipe", "inherit"],
    cwd: process.cwd(),
    env: {
      ...process.env,
      SSOT_DIR: temp.ssotDir,
      S2S_CP_HMAC: "dummy",
      S2S_CI_HMAC: "dummy",
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
  const apiBase = baseUrl + "/api";
  await sleep(200);

  const healthRes = await fetch(apiBase + "/health");
  if (healthRes.status !== 200) throw new Error("GET /api/health status " + healthRes.status);

  const activeRes = await fetch(apiBase + "/runtime/active-release");
  if (activeRes.status !== 200) throw new Error("GET /api/runtime/active-release status " + activeRes.status);

  const token = await getS2SToken({
    baseUrl,
    principalId: "svc:ci",
    secret: "dummy",
    scopes: ["observability.read"]
  });
  const authHeaders = { authorization: "Bearer " + token };

  const reportsRes = await fetch(apiBase + "/reports/latest?kind=workflows&limit=10", { headers: authHeaders });
  if (reportsRes.status !== 200) throw new Error("GET /api/reports/latest?kind=workflows status " + reportsRes.status);
  const reportsJson = await reportsRes.json();
  if (!reportsJson.hasOwnProperty("lines")) throw new Error("reports/latest missing lines");

  const gatesRes = await fetch(apiBase + "/reports/latest?kind=gates&limit=5", { headers: authHeaders });
  if (gatesRes.status !== 200) throw new Error("GET /api/reports/latest?kind=gates status " + gatesRes.status);

  server.kill("SIGTERM");
  temp.cleanup();
  console.log("CP cockpit smoke PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
