/**
 * Phase AQ: Accounting execute guard — denied without approval, allowed with breakglass, artifacts written.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const reportsDir = join(process.cwd(), "runtime", "reports");
  const govDir = join(reportsDir, "governance");
  mkdirSync(govDir, { recursive: true });

  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
  const api = `${baseUrl}/api`;
  await sleep(200);

  const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
  const auth = { authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const correlationDenied = `aq-denied-${Date.now()}`;
  const resDenied = await fetch(`${api}/studio/workflows/run`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      workflow_id: "workflow:accounting_sync_run",
      mode: "execute",
      correlation_id: correlationDenied
    })
  });
  if (resDenied.status !== 423) throw new Error(`expected 423 without approval, got ${resDenied.status}`);
  const bodyDenied = await resDenied.json().catch(() => ({}));
  if (bodyDenied.code !== "accounting_guard") throw new Error("expected code accounting_guard");

  const breakglassPath = join(govDir, "breakglass_latest.jsonl");
  const quorumPath = join(govDir, "quorum_latest.jsonl");
  if (!existsSync(breakglassPath)) throw new Error("missing breakglass_latest.jsonl");
  if (!existsSync(quorumPath)) throw new Error("missing quorum_latest.jsonl");
  const breakglassLines = readFileSync(breakglassPath, "utf-8").trim().split("\n").filter(Boolean);
  const quorumLines = readFileSync(quorumPath, "utf-8").trim().split("\n").filter(Boolean);
  if (!breakglassLines.length || !quorumLines.length) throw new Error("governance index entries missing");

  const bgPath = join(temp.ssotDir, "governance", "break_glass.json");
  const bg = JSON.parse(readFileSync(bgPath, "utf-8"));
  bg.enabled = true;
  bg.expires_at = new Date(Date.now() + 3600000).toISOString();
  bg.allowed_actions = ["accounting.execute"];
  bg.scope = "platform:*";
  writeFileSync(bgPath, JSON.stringify(bg, null, 2) + "\n");

  const correlationAllowed = `aq-allowed-${Date.now()}`;
  const resAllowed = await fetch(`${api}/studio/workflows/run`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      workflow_id: "workflow:accounting_sync_run",
      mode: "execute",
      correlation_id: correlationAllowed
    })
  });
  if (resAllowed.status !== 200) throw new Error(`expected 200 with breakglass, got ${resAllowed.status}: ${await resAllowed.text()}`);
  const result = await resAllowed.json();
  if (!result.ok) throw new Error("workflow run should be ok with breakglass");

  const breakglassLinesAfter = readFileSync(breakglassPath, "utf-8").trim().split("\n").filter(Boolean);
  const lastBg = breakglassLinesAfter.length ? JSON.parse(breakglassLinesAfter[breakglassLinesAfter.length - 1]) : null;
  if (!lastBg || !lastBg.allowed) throw new Error("breakglass event should show allowed after enable");

  killServer(server);
  temp.cleanup();
  console.log("Accounting breakglass guard PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
