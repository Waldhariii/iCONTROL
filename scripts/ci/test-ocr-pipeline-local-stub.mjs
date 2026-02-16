/**
 * Phase AJ: OCR pipeline local stub — run workflow:ocr_ingest + workflow:ocr_normalize execute;
 * verify artifacts (ingested + normalized) + ocr_latest.jsonl + RUN_REPORT.
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
  const ocrIndexPath = join(reportsDir, "index", "ocr_latest.jsonl");
  const beforeOcrLines = existsSync(ocrIndexPath) ? readFileSync(ocrIndexPath, "utf-8").trim().split("\n").filter(Boolean).length : 0;

  const run1 = await fetch(`${api}/studio/workflows/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ workflow_id: "workflow:ocr_ingest", mode: "execute", inputs: { path: "/tmp/doc.pdf" } })
  });
  if (run1.status !== 200) throw new Error(`ocr_ingest status ${run1.status}: ${await run1.text()}`);
  const payload1 = await run1.json();
  if (!payload1.ok) throw new Error("ocr_ingest payload.ok false");
  const corr1 = payload1.correlation_id;
  if (!corr1) throw new Error("ocr_ingest missing correlation_id");

  const run2 = await fetch(`${api}/studio/workflows/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ workflow_id: "workflow:ocr_normalize", mode: "execute", inputs: { ingest_artifact_path: `ingested_${corr1}_0.json` } })
  });
  if (run2.status !== 200) throw new Error(`ocr_normalize status ${run2.status}: ${await run2.text()}`);
  const payload2 = await run2.json();
  if (!payload2.ok) throw new Error("ocr_normalize payload.ok false");
  const corr2 = payload2.correlation_id;

  const artifactsDir1 = join(artifactsBase, corr1);
  const artifactsDir2 = join(artifactsBase, corr2);
  if (!existsSync(artifactsDir1)) throw new Error(`missing runtime/artifacts/${corr1}`);
  if (!existsSync(artifactsDir2)) throw new Error(`missing runtime/artifacts/${corr2}`);
  const files1 = readdirSync(artifactsDir1);
  const files2 = readdirSync(artifactsDir2);
  const hasIngested = files1.some((f) => f.startsWith("ingested_") && f.endsWith(".json"));
  const hasNormalized = files2.some((f) => f.startsWith("normalized_") && f.endsWith(".json"));
  if (!hasIngested) throw new Error(`expected ingested_*.json in runtime/artifacts/${corr1}, got: ${files1.join(", ")}`);
  if (!hasNormalized) throw new Error(`expected normalized_*.json in runtime/artifacts/${corr2}, got: ${files2.join(", ")}`);

  const afterOcrLines = existsSync(ocrIndexPath) ? readFileSync(ocrIndexPath, "utf-8").trim().split("\n").filter(Boolean) : [];
  const added = afterOcrLines.length - beforeOcrLines;
  if (added < 2) throw new Error(`ocr_latest.jsonl expected at least 2 new lines, got ${added}`);

  const runReport1 = join(reportsDir, "workflows", corr1, "RUN_REPORT.json");
  const runReport2 = join(reportsDir, "workflows", corr2, "RUN_REPORT.json");
  if (!existsSync(runReport1)) throw new Error(`missing RUN_REPORT.json for ${corr1}`);
  if (!existsSync(runReport2)) throw new Error(`missing RUN_REPORT.json for ${corr2}`);

  server.kill("SIGTERM");
  temp.cleanup();
  console.log("OCR pipeline local stub PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
