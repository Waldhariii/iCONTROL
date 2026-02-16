/**
 * Phase AI/AK: Action export_pdf end-to-end — hermetic PORT=0 + spawn-server helper.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
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
  const api = `${baseUrl}/api`;
  await sleep(200);

  const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
  const authHeaders = { authorization: `Bearer ${token}` };

  const reportsDir = join(process.cwd(), "runtime", "reports");
  const artifactsBase = join(process.cwd(), "runtime", "artifacts");
  const indexPath = join(reportsDir, "index", "workflows_latest.jsonl");
  const beforeLines = existsSync(indexPath) ? readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean).length : 0;

  const res = await fetch(`${api}/studio/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      action_id: "a1",
      kind: "export_pdf",
      policy_id: "policy:default"
    })
  });
  if (res.status !== 200) {
    const t = await res.text();
    throw new Error(`studio/action status ${res.status}: ${t}`);
  }
  const payload = await res.json();
  if (!payload.ok) throw new Error("studio/action payload.ok false");
  if (!payload.correlation_id) throw new Error("studio/action missing correlation_id");

  const corr = payload.correlation_id;
  const releaseId = "dev-001";
  const artifactsDir = join(artifactsBase, releaseId, corr);
  if (!existsSync(artifactsDir)) throw new Error(`missing runtime/artifacts/${releaseId}/${corr}`);
  const artifactFiles = readdirSync(artifactsDir);
  const hasPdf = artifactFiles.some((f) => f.endsWith(".pdf"));
  if (!hasPdf) throw new Error(`expected .pdf artifact in runtime/artifacts/${releaseId}/${corr}, got: ${artifactFiles.join(", ")}`);

  const afterLines = existsSync(indexPath) ? readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean) : [];
  const added = afterLines.length - beforeLines;
  if (added < 1) throw new Error(`workflows_latest.jsonl expected at least 1 new line, got ${added}`);
  const lastLine = afterLines[afterLines.length - 1];
  const indexEntry = JSON.parse(lastLine);
  if (indexEntry.correlation_id !== corr) throw new Error("index entry correlation_id mismatch");

  const workflowReportDir = join(reportsDir, "workflows", corr);
  if (!existsSync(workflowReportDir)) throw new Error(`missing runtime/reports/workflows/${corr}`);
  const runReportPath = join(workflowReportDir, "RUN_REPORT.json");
  if (!existsSync(runReportPath)) throw new Error(`missing RUN_REPORT.json in workflows/${corr}`);

  killServer(server);
  temp.cleanup();
  console.log("Action export_pdf end2end PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
