/**
 * Phase AI: Action export_pdf end-to-end — POST /api/studio/action with kind export_pdf
 * triggers workflow execute; verifies artifact pdf + workflows_latest.jsonl + 200.
 */
import { spawn } from "child_process";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";

function __icParseBoundLine(line) {
  const m = String(line || "").match(/__IC_BOUND__=(\{.*\})/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: ["ignore", "pipe", "inherit"],
    cwd: process.cwd(),
    env: {
      ...process.env,
      SSOT_DIR: temp.ssotDir,
      S2S_CP_HMAC: "dummy",
      S2S_TOKEN_SIGN: "dummy",
      CI: "true",
      HOST: "127.0.0.1",
      PORT: "0"
    }
  });

  let baseUrl = "";
  const chunks = [];
  server.stdout.on("data", (chunk) => chunks.push(chunk));
  const deadline = Date.now() + 10000;
  while (!baseUrl && Date.now() < deadline) {
    await sleep(50);
    const out = Buffer.concat(chunks).toString("utf-8");
    for (const line of out.split(/\r?\n/)) {
      const bound = __icParseBoundLine(line);
      if (bound) {
        baseUrl = `http://${bound.host || "127.0.0.1"}:${bound.port || 7070}`;
        break;
      }
    }
  }
  if (!baseUrl) baseUrl = "http://127.0.0.1:7070";
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
  const artifactsDir = join(artifactsBase, corr);
  if (!existsSync(artifactsDir)) throw new Error(`missing runtime/artifacts/${corr}`);
  const artifactFiles = readdirSync(artifactsDir);
  const hasPdf = artifactFiles.some((f) => f.endsWith(".pdf"));
  if (!hasPdf) throw new Error(`expected .pdf artifact in runtime/artifacts/${corr}, got: ${artifactFiles.join(", ")}`);

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

  server.kill("SIGTERM");
  temp.cleanup();
  console.log("Action export_pdf end2end PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
