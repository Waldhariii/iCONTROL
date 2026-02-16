/**
 * Phase AG/AK: Control Plane Cockpit smoke — hermetic PORT=0 + spawn-server helper.
 */
import { existsSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  if (!existsSync("apps/control-plane/index.html")) throw new Error("missing apps/control-plane/index.html");
  if (!existsSync("apps/control-plane/cockpit.js")) throw new Error("missing apps/control-plane/cockpit.js");

  const temp = createTempSsot();
  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_CI_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
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

  killServer(server);
  temp.cleanup();
  console.log("CP cockpit smoke PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
