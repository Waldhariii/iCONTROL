/**
 * Phase AH: PDF adapter — local minimal PDF generation via pdf-lib (no external service).
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PDFDocument } from "pdf-lib";

const KIND = "pdf.generate";

/**
 * @param {import("../types.mjs").AdapterContext} ctx
 */
export async function run(ctx) {
  const stepId = ctx.step_id || "pdf.generate";
  if (ctx.dry_run) {
    return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [`stub:${ctx.correlation_id}:pdf`] };
  }
  const artifactsDir = ctx.artifacts_dir;
  if (!artifactsDir) return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [] };

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 300]);
  const title = String(ctx.inputs?.title ?? ctx.workflow_id ?? "Export").slice(0, 80);
  page.drawText(title, { x: 50, y: 250, size: 12 });
  page.drawText(`correlation_id: ${ctx.correlation_id || ""}`, { x: 50, y: 220, size: 10 });
  page.drawText(`at: ${new Date().toISOString()}`, { x: 50, y: 190, size: 10 });
  const pdfBytes = await pdfDoc.save();

  const artifactId = `invoice_${ctx.correlation_id}_${Date.now()}.pdf`;
  mkdirSync(artifactsDir, { recursive: true });
  writeFileSync(join(artifactsDir, artifactId), pdfBytes);

  return { ok: true, step_id: stepId, kind: KIND, artifact_ids: [artifactId] };
}

export default { kind: KIND, version: "1.0.0", capabilities: ["pdf.local"], run };
