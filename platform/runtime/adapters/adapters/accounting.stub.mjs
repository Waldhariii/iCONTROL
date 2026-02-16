/**
 * Phase AF: Accounting adapter stub. No external I/O; writes stub artifact when execute.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const KIND = "accounting.sync";

/**
 * @param {import("../types.mjs").AdapterContext} ctx
 */
export async function run(ctx) {
  const stepId = ctx.step_id || "accounting.sync";
  if (ctx.dry_run) {
    return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [`stub:${ctx.correlation_id}:accounting`] };
  }
  const artifactsDir = ctx.artifacts_dir;
  if (!artifactsDir) return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [] };
  const artifactId = `accounting_${ctx.correlation_id}_${Date.now()}.stub.json`;
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
  return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [artifactId] };
}

export default { kind: KIND, version: "1.0.0", capabilities: ["stub"], run };
