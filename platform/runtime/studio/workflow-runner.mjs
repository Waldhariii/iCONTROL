/**
 * Phase AE/AF: Workflow runner for BizDocs. Dry-run by default; execute mode uses adapters (local artifacts only).
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { bootstrapAdapters } from "../adapters/bootstrap.mjs";
import { get } from "../adapters/registry.mjs";

/** In-code minimal workflow -> steps mapping (v1). No SSOT change. */
const WORKFLOW_PLANS = {
  "workflow:pdf_export_invoice": ["pdf.generate"],
  "workflow:pdf_export_quote": ["pdf.generate"],
  "workflow:pdf_export_report": ["pdf.generate"],
  "workflow:ocr_ingest": ["ocr.ingest"],
  "workflow:ocr_normalize": ["ocr.ingest"],
  "workflow:accounting_sync_run": ["accounting.sync"],
  "workflow:job_created_notify": ["notify.send"],
  "workflow:doc_ingest_classify": ["ocr.ingest"]
};

/**
 * @param {{
 *   workflow_id: string,
 *   inputs?: Record<string, unknown>,
 *   mode?: "dry_run" | "execute" | "live",
 *   correlation_id?: string,
 *   actor?: string,
 *   reports_dir?: string,
 *   artifacts_base_dir?: string
 * }} opts
 * @returns {{ ok: boolean, workflow_id: string, mode: string, steps: Array<{ step_id: string, status: string, kind?: string }>, artifacts: Array<{ artifact_id: string, kind: string }>, correlation_id?: string }}
 */
export async function runWorkflow(opts = {}) {
  const workflow_id = opts.workflow_id || "";
  const mode = opts.mode === "execute" ? "execute" : opts.mode === "live" ? "execute" : "dry_run";
  const correlation_id = opts.correlation_id || "";
  const actor = opts.actor || "system";
  const reports_dir = opts.reports_dir || "";
  const artifacts_base_dir = opts.artifacts_base_dir || "";

  if (!workflow_id) {
    return Promise.resolve({
      ok: false,
      workflow_id: "",
      mode: "dry_run",
      steps: [{ step_id: "validate", status: "failed" }],
      artifacts: []
    });
  }

  const plan = WORKFLOW_PLANS[workflow_id];
  const dry_run = mode === "dry_run";
  const steps = [];
  const artifacts = [];

  // dry_run without plan: legacy stub result (AE-compat)
  if (dry_run && !plan) {
    return Promise.resolve({
      ok: true,
      workflow_id,
      mode: "dry_run",
      steps: [
        { step_id: "validate", status: "ok" },
        { step_id: "execute_stub", status: "ok", correlation_id, actor }
      ],
      artifacts: [{ artifact_id: `dryrun:${workflow_id}:${Date.now()}`, kind: "audit_log" }]
    });
  }

  // dry_run with plan: run adapters in dry_run
  if (dry_run && plan) {
    bootstrapAdapters();
    for (let i = 0; i < plan.length; i++) {
      const kind = plan[i];
      const stepId = `${kind}_${i}`;
      try {
        const adapter = get(kind);
        const result = await adapter.run({
          correlation_id,
          actor,
          inputs: opts.inputs || {},
          dry_run: true,
          artifacts_dir: "",
          workflow_id,
          step_id: stepId
        });
        steps.push({ step_id: stepId, status: result.ok ? "ok" : "failed", kind });
        if (result.artifact_ids && result.artifact_ids.length) {
          for (const aid of result.artifact_ids) artifacts.push({ artifact_id: aid, kind });
        }
      } catch (err) {
        steps.push({ step_id: stepId, status: "failed", kind, error: String(err && err.message) });
      }
    }
    return {
      ok: steps.every((s) => s.status === "ok"),
      workflow_id,
      mode: "dry_run",
      steps,
      artifacts,
      correlation_id
    };
  }

  // execute: run adapters with real artifacts_dir, write RUN_REPORT
  bootstrapAdapters();
  const artifacts_dir = artifacts_base_dir ? join(artifacts_base_dir, correlation_id || "run") : "";
  const workflow_reports_dir = reports_dir ? join(reports_dir, "workflows", correlation_id || "run") : "";

  for (let i = 0; i < (plan || []).length; i++) {
    const kind = plan[i];
    const stepId = `${kind}_${i}`;
    try {
      const adapter = get(kind);
      const result = await adapter.run({
        correlation_id,
        actor,
        inputs: opts.inputs || {},
        dry_run: false,
        artifacts_dir,
        workflow_id,
        step_id: stepId
      });
      steps.push({ step_id: stepId, status: result.ok ? "ok" : "failed", kind });
      if (result.artifact_ids && result.artifact_ids.length) {
        for (const aid of result.artifact_ids) artifacts.push({ artifact_id: aid, kind });
      }
    } catch (err) {
      steps.push({ step_id: stepId, status: "failed", kind, error: String(err && err.message) });
    }
  }

  const ok = steps.every((s) => s.status === "ok");

  if (workflow_reports_dir) {
    mkdirSync(workflow_reports_dir, { recursive: true });
    const runReport = {
      workflow_id,
      mode: "execute",
      correlation_id,
      actor,
      ok,
      steps,
      artifacts,
      at: new Date().toISOString()
    };
    writeFileSync(join(workflow_reports_dir, "RUN_REPORT.json"), JSON.stringify(runReport, null, 2), "utf-8");
    writeFileSync(
      join(workflow_reports_dir, "RUN_REPORT.md"),
      `# Workflow Run\n\nworkflow_id: ${workflow_id}\nok: ${ok}\ncorrelation_id: ${correlation_id}\n`,
      "utf-8"
    );
  }

  return {
    ok,
    workflow_id,
    mode: "execute",
    steps,
    artifacts,
    correlation_id
  };
}
