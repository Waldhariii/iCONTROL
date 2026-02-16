/**
 * Phase AE: workflow runner dry-run via POST /api/studio/workflows/run.
 * Starts API CI-safe (localhost + port=0), calls workflow:accounting_sync_run + workflow:pdf_export_invoice,
 * verifies 200 + payload ok + index jsonl contains correlation_id.
 */
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
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

  const indexPath = join(process.cwd(), "runtime", "reports", "index", "workflows_latest.jsonl");
  const beforeLines = existsSync(indexPath) ? readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean).length : 0;

  const workflows = ["workflow:accounting_sync_run", "workflow:pdf_export_invoice"];
  for (const workflow_id of workflows) {
    const res = await fetch(`${api}/studio/workflows/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ workflow_id, mode: "dry_run" })
    });
    if (res.status !== 200) {
      const t = await res.text();
      throw new Error(`workflows/run ${workflow_id} status ${res.status}: ${t}`);
    }
    const payload = await res.json();
    if (!payload.ok) throw new Error(`workflows/run ${workflow_id} payload.ok false`);
    if (!payload.correlation_id) throw new Error(`workflows/run ${workflow_id} missing correlation_id`);
    if (payload.workflow_id !== workflow_id) throw new Error(`workflows/run ${workflow_id} workflow_id mismatch`);
    if (payload.mode !== "dry_run") throw new Error(`workflows/run ${workflow_id} mode !== dry_run`);
  }

  const afterLines = existsSync(indexPath) ? readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean) : [];
  const added = afterLines.length - beforeLines;
  if (added < workflows.length) throw new Error(`index jsonl expected at least ${workflows.length} new lines, got ${added}`);
  const lastLines = afterLines.slice(-workflows.length);
  for (const line of lastLines) {
    const entry = JSON.parse(line);
    if (!entry.correlation_id) throw new Error("index entry missing correlation_id");
  }

  server.kill("SIGTERM");
  temp.cleanup();
  console.log("Workflow runner dry-run PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
