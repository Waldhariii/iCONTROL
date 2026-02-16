/**
 * Phase AK: Runtime hermeticity — PORT=0, spawn helper, kill server, no hardcoded port.
 */
import { createTempSsot } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

async function run() {
  const temp = createTempSsot();
  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: {
      ...process.env,
      SSOT_DIR: temp.ssotDir,
      S2S_CP_HMAC: "dummy",
      S2S_TOKEN_SIGN: "dummy"
    }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
  if (!baseUrl || baseUrl.includes("7070")) throw new Error("Base URL must not use hardcoded 7070");
  const res = await fetch(`${baseUrl}/api/health`);
  if (res.status !== 200) throw new Error(`GET /api/health status ${res.status}`);
  killServer(server);
  temp.cleanup();
  console.log("Runtime hermeticity PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
