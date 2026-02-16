/**
 * Phase AO: Auto-freeze trigger — evaluate with budget_burn_high, verify report + index + publish 423.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const reportsDir = join(process.cwd(), "runtime", "reports");

  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
  const api = `${baseUrl}/api`;
  await sleep(200);

  const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["ops.*", "studio.*"] });
  const authHeaders = { authorization: `Bearer ${token}` };

  const correlationId = `autofreeze-${Date.now()}`;
  const evalRes = await fetch(`${api}/ops/auto-freeze/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      tenant_id: "tenant:default",
      signals: { budget_burn_high: true },
      correlation_id: correlationId
    })
  });
  if (evalRes.status !== 200) throw new Error(`evaluate status ${evalRes.status}: ${await evalRes.text()}`);
  const evalBody = await evalRes.json();
  if (!evalBody.applied || !evalBody.freeze_enabled) throw new Error("expected applied and freeze_enabled true");

  const reportDir = join(reportsDir, "ops", correlationId);
  if (!existsSync(reportDir)) throw new Error(`missing report dir ${reportDir}`);
  if (!existsSync(join(reportDir, "AUTO_FREEZE_REPORT.json"))) throw new Error("missing AUTO_FREEZE_REPORT.json");
  const report = JSON.parse(readFileSync(join(reportDir, "AUTO_FREEZE_REPORT.json"), "utf-8"));
  if (!report.trigger || report.correlation_id !== correlationId) throw new Error("report mismatch");

  const indexPath = join(reportsDir, "index", "ops_latest.jsonl");
  if (!existsSync(indexPath)) throw new Error("missing ops_latest.jsonl");
  const indexLines = readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean);
  const lastLine = indexLines.length ? JSON.parse(indexLines[indexLines.length - 1]) : null;
  if (!lastLine || lastLine.action !== "auto_freeze_evaluate" || !lastLine.trigger) throw new Error("index entry mismatch");

  const publishRes = await fetch(`${api}/changesets/cs-fake-ao/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({})
  });
  if (publishRes.status !== 423) throw new Error(`expected 423 from publish when freeze active, got ${publishRes.status}`);
  const publishBody = await publishRes.json().catch(() => ({}));
  if (publishBody.code !== "freeze") throw new Error("expected code freeze in 423 response");

  killServer(server);
  temp.cleanup();
  console.log("Auto-freeze trigger PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
