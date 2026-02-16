/**
 * Phase AF/AJ: OCR adapter local stub. Ingest → artifact "ingested"; normalize → artifact "normalized"; journal to ocr_latest.jsonl.
 */
import { writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

const KIND = "ocr.ingest";

/**
 * @param {import("../types.mjs").AdapterContext} ctx
 */
export async function run(ctx) {
  const stepId = ctx.step_id || "ocr.ingest";
  if (ctx.dry_run) {
    return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [`stub:${ctx.correlation_id}:ocr`] };
  }
  const artifactsDir = ctx.artifacts_dir;
  const reportsDir = ctx.reports_dir || "";
  const workflow_id = ctx.workflow_id || "";
  const isNormalize = workflow_id === "workflow:ocr_normalize";
  const stepName = isNormalize ? "normalize" : "ingest";
  const artifactPrefix = isNormalize ? "normalized" : "ingested";
  const artifactId = `${artifactPrefix}_${ctx.correlation_id}_${Date.now()}.json`;
  const artifactIds = [];

  if (artifactsDir) {
    mkdirSync(artifactsDir, { recursive: true });
    const payload = isNormalize
      ? {
          normalized: true,
          kind: KIND,
          correlation_id: ctx.correlation_id,
          workflow_id,
          ingest_artifact_path: ctx.inputs?.ingest_artifact_path || "",
          at: new Date().toISOString()
        }
      : {
          ingested: true,
          kind: KIND,
          correlation_id: ctx.correlation_id,
          workflow_id,
          document_path: ctx.inputs?.document_path || ctx.inputs?.path || "",
          at: new Date().toISOString()
        };
    writeFileSync(join(artifactsDir, artifactId), JSON.stringify(payload, null, 2), "utf-8");
    artifactIds.push(artifactId);
  }

  if (reportsDir) {
    const indexDir = join(reportsDir, "index");
    mkdirSync(indexDir, { recursive: true });
    const line =
      JSON.stringify({
        ts: new Date().toISOString(),
        correlation_id: ctx.correlation_id,
        step: stepName,
        ok: true,
        workflow_id,
        artifact_paths: artifactIds
      }) + "\n";
    appendFileSync(join(indexDir, "ocr_latest.jsonl"), line, "utf-8");
  }

  return { ok: true, step_id: stepId, kind: KIND, artifact_ids: artifactIds };
}

export default { kind: KIND, version: "1.0.0", capabilities: ["local_stub"], run };
