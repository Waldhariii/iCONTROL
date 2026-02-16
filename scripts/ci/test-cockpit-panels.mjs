/**
 * Phase AT: Control plane cockpit v2 — panels data from runtime/reports/index (and freeze).
 */
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
  await sleep(200);

  const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["observability.read", "studio.*"] });
  const headers = { authorization: `Bearer ${token}`, Accept: "application/json" };

  const releasesRes = await fetch(`${baseUrl}/api/reports/latest?kind=releases&limit=5`, { headers });
  if (releasesRes.status !== 200) throw new Error("releases panel: " + releasesRes.status);
  const releasesData = await releasesRes.json();
  if (!releasesData.kind || releasesData.kind !== "releases") throw new Error("releases kind mismatch");

  const schedulerRes = await fetch(`${baseUrl}/api/reports/latest?kind=scheduler&limit=5`, { headers });
  if (schedulerRes.status !== 200) throw new Error("scheduler panel: " + schedulerRes.status);

  const freezeRes = await fetch(`${baseUrl}/api/studio/freeze`, { headers });
  if (freezeRes.status !== 200) throw new Error("freeze panel: " + freezeRes.status);
  const freezeData = await freezeRes.json();
  if (typeof freezeData.enabled !== "boolean") throw new Error("freeze shape");

  const workflowsRes = await fetch(`${baseUrl}/api/reports/latest?kind=workflows&limit=5`, { headers });
  if (workflowsRes.status !== 200) throw new Error("workflows panel: " + workflowsRes.status);

  killServer(server);
  temp.cleanup();
  console.log("Cockpit panels v2 PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
