/**
 * Phase AH/AK: When change freeze is enabled and scopes.content_mutations, execute mode returns 423. Hermetic PORT=0.
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

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

  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
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
  killServer(server);
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
