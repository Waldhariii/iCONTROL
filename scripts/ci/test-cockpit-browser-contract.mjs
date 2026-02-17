/**
 * CI: Cockpit browser contract — OPTIONS 204, GET 200 with Origin (no custom header).
 * DevCockpitGate: loopback + origin allowlist only.
 */
import { createTempSsot } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

const ORIGIN = "http://127.0.0.1:5173";
const REPORT_KINDS = ["gates", "workflows", "marketplace", "billing", "webhook", "ops", "releases", "scheduler", "breakglass", "quorum"];

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

  const originHeaders = { Origin: ORIGIN };

  const optPaths = [
    "/health",
    "/reports/latest?kind=gates&limit=50",
    "/studio/freeze"
  ];
  for (const path of optPaths) {
    const res = await fetch(api + path, {
      method: "OPTIONS",
      headers: { ...originHeaders, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "content-type" }
    });
    if (res.status !== 204) throw new Error(`OPTIONS /api${path} expected 204, got ${res.status}`);
  }

  const get200 = [
    [api + "/health", "health"],
    [api + "/releases/active", "releases/active"],
    [api + "/runtime/active-release", "runtime/active-release"],
    [api + "/studio/freeze", "studio/freeze"]
  ];
  for (const [url, name] of get200) {
    const res = await fetch(url, { headers: originHeaders });
    if (res.status !== 200) throw new Error(`GET ${name} expected 200, got ${res.status}`);
  }

  for (const kind of REPORT_KINDS) {
    const res = await fetch(api + "/reports/latest?kind=" + kind + "&limit=50", { headers: originHeaders });
    if (res.status !== 200) throw new Error(`GET reports/latest?kind=${kind} expected 200, got ${res.status}`);
  }

  const noOrigin = await fetch(api + "/reports/latest?kind=gates&limit=50");
  if (noOrigin.status !== 401 && noOrigin.status !== 403) {
    throw new Error("GET without Origin expected 401 or 403, got " + noOrigin.status);
  }

  killServer(server);
  temp.cleanup();
  console.log("Cockpit browser contract PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
