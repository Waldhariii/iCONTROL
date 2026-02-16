/**
 * Phase AR: OCR contract lock — fingerprint deterministic, schema validated, artifact path compliant.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { createTempSsot } from "./test-utils.mjs";
import { runWorkflow } from "../../platform/runtime/studio/workflow-runner.mjs";

const temp = createTempSsot();
const reportsDir = join(process.cwd(), "runtime", "reports");
const artifactsBase = join(process.cwd(), "runtime", "artifacts", "dev-001");
const correlationId = `ocr-contract-${Date.now()}`;

const result = await runWorkflow({
  workflow_id: "workflow:ocr_ingest",
  mode: "execute",
  correlation_id: correlationId,
  reports_dir: reportsDir,
  artifacts_base_dir: artifactsBase
});

if (!result.ok) throw new Error("workflow run failed");
const runDir = join(artifactsBase, correlationId);
if (!existsSync(runDir)) throw new Error("artifact dir missing");
const files = readdirSync(runDir).filter((f) => f.endsWith(".json"));
if (files.length === 0) throw new Error("no artifact written");
const artifactPath = join(runDir, files[0]);
const payload = JSON.parse(readFileSync(artifactPath, "utf-8"));
if (!payload.fingerprint || typeof payload.fingerprint !== "string") throw new Error("missing fingerprint");
if (!payload.datasource_id || !payload.correlation_id || !payload.created_at) throw new Error("missing required fields");
if (payload.correlation_id !== correlationId) throw new Error("correlation_id mismatch");

const { validateOrThrow } = await import("../../core/contracts/schema/validate.mjs");
validateOrThrow("ocr_ingest_artifact.v1", payload, "test");

const { sha256, stableStringify } = await import("../../platform/compilers/utils.mjs");
const { fingerprint, ...rest } = payload;
const expectedFp = sha256(stableStringify(rest));
if (fingerprint !== expectedFp) throw new Error("fingerprint not deterministic");

temp.cleanup();
console.log("OCR contract lock PASS");
