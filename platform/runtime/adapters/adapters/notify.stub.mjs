/**
 * Phase AF/AH: Notify adapter stub. No external I/O; journal to notify_latest.jsonl when execute.
 */
import { writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

const KIND = "notify.send";

/**
 * @param {import("../types.mjs").AdapterContext} ctx
 */
export async function run(ctx) {
  const stepId = ctx.step_id || "notify.send";
  if (ctx.dry_run) {
    return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [`stub:${ctx.correlation_id}:notify`] };
  }
  const artifactsDir = ctx.artifacts_dir;
  const reportsDir = ctx.reports_dir || "";
  const artifactIds = [];
  if (artifactsDir) {
    const artifactId = `notify_${ctx.correlation_id}_${Date.now()}.stub.json`;
    mkdirSync(artifactsDir, { recursive: true });
    writeFileSync(
      join(artifactsDir, artifactId),
      JSON.stringify({
        stub: true,
        kind: KIND,
        correlation_id: ctx.correlation_id,
        workflow_id: ctx.workflow_id,
        at: new Date().toISOString()
      }, null, 2),
      "utf-8"
    );
    artifactIds.push(artifactId);
  }
  if (reportsDir) {
    const indexDir = join(reportsDir, "index");
    mkdirSync(indexDir, { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      kind: KIND,
      correlation_id: ctx.correlation_id,
      workflow_id: ctx.workflow_id,
      step_id: stepId,
      at: new Date().toISOString()
    }) + "\n";
    appendFileSync(join(indexDir, "notify_latest.jsonl"), line, "utf-8");
  }
  return { ok: true, step_id: stepId, kind: KIND, artifact_ids: artifactIds };
}

export default { kind: KIND, version: "1.0.0", capabilities: ["stub"], run };
