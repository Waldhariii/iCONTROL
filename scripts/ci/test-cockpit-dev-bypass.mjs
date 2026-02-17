/**
 * CI: Cockpit DEV bypass V10 — OPTIONS 204, GET with Origin (no x-ic-dev) => 200, GET without => 401/403.
 * Spawns backend with PORT=0, asserts loopback+origin allowlist only.
 */
import { createTempSsot } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

const ORIGIN = "http://127.0.0.1:5173";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: {
      ...process.env,
      SSOT_DIR: temp.ssotDir,
      S2S_CP_HMAC: "dummy",
      S2S_CI_HMAC: "dummy",
      S2S_TOKEN_SIGN: "dummy"
    }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
  const api = baseUrl + "/api";
  await sleep(200);

  // OPTIONS preflight with Origin allowlist => 204 (no custom header required)
  const optRes = await fetch(api + "/reports/latest?kind=gates&limit=50", {
    method: "OPTIONS",
    headers: {
      Origin: ORIGIN,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type,x-ic-dev"
    }
  });
  if (optRes.status !== 204) {
    throw new Error(`OPTIONS /api/reports/latest expected 204, got ${optRes.status}`);
  }

  // GET with Origin only => 200
  const activeRes = await fetch(api + "/runtime/active-release", { headers: { Origin: ORIGIN } });
  if (activeRes.status !== 200) {
    throw new Error(`GET /api/runtime/active-release expected 200, got ${activeRes.status}`);
  }

  const reportsRes = await fetch(api + "/reports/latest?kind=gates&limit=50", { headers: { Origin: ORIGIN } });
  if (reportsRes.status !== 200) {
    throw new Error(`GET /api/reports/latest?kind=gates expected 200, got ${reportsRes.status}`);
  }

  const freezeRes = await fetch(api + "/studio/freeze", { headers: { Origin: ORIGIN } });
  if (freezeRes.status !== 200) {
    throw new Error(`GET /api/studio/freeze expected 200, got ${freezeRes.status}`);
  }

  // Negative: no Origin => 401 or 403
  const noOriginRes = await fetch(api + "/reports/latest?kind=gates&limit=50");
  if (noOriginRes.status !== 401 && noOriginRes.status !== 403) {
    throw new Error(`GET /api/reports/latest without Origin expected 401 or 403, got ${noOriginRes.status}`);
  }

  killServer(server);
  temp.cleanup();
  console.log("Cockpit DEV bypass test PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
