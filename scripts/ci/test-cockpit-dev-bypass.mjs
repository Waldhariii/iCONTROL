/**
 * CI: Cockpit DEV bypass — OPTIONS 204, GET with ic_dev=1 => 200, GET without => 401/403.
 * Spawns backend with PORT=0, then asserts loopback+origin+dev gate behavior.
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

  // OPTIONS preflight with Origin allowlist + dev flag (same URL as GET will use) => 204
  const optRes = await fetch(api + "/reports/latest?kind=gates&limit=50&ic_dev=1", {
    method: "OPTIONS",
    headers: {
      Origin: ORIGIN,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type,x-ic-dev"
    }
  });
  if (optRes.status !== 204) {
    throw new Error(`OPTIONS /api/reports/latest?ic_dev=1 expected 204, got ${optRes.status}`);
  }

  // GET with ic_dev=1 + Origin => 200 (active release; backend uses /api/runtime/active-release)
  const activeRes = await fetch(api + "/runtime/active-release?ic_dev=1", {
    headers: { Origin: ORIGIN }
  });
  if (activeRes.status !== 200) {
    throw new Error(`GET /api/runtime/active-release?ic_dev=1 expected 200, got ${activeRes.status}`);
  }

  const reportsRes = await fetch(api + "/reports/latest?kind=gates&limit=50&ic_dev=1", {
    headers: { Origin: ORIGIN }
  });
  if (reportsRes.status !== 200) {
    throw new Error(`GET /api/reports/latest?kind=gates&ic_dev=1 expected 200, got ${reportsRes.status}`);
  }

  const freezeRes = await fetch(api + "/studio/freeze?ic_dev=1", {
    headers: { Origin: ORIGIN }
  });
  if (freezeRes.status !== 200) {
    throw new Error(`GET /api/studio/freeze?ic_dev=1 expected 200, got ${freezeRes.status}`);
  }

  // Negative: no ic_dev, no x-ic-dev => 401 or 403
  const noDevRes = await fetch(api + "/reports/latest?kind=gates&limit=50", {
    headers: { Origin: ORIGIN }
  });
  if (noDevRes.status !== 401 && noDevRes.status !== 403) {
    throw new Error(`GET /api/reports/latest without ic_dev expected 401 or 403, got ${noDevRes.status}`);
  }

  killServer(server);
  temp.cleanup();
  console.log("Cockpit DEV bypass test PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
