/**
 * Phase AE: workflow runner for BizDocs. Dry-run by default; no external I/O in dry_run.
 */

/**
 * @param {{
 *   workflow_id: string,
 *   inputs?: Record<string, unknown>,
 *   mode?: "dry_run" | "live",
 *   correlation_id?: string,
 *   actor?: string
 * }} opts
 * @returns {{ ok: boolean, workflow_id: string, mode: string, steps: Array<{ step_id: string, status: string }>, artifacts: Array<{ artifact_id: string, kind: string }> }}
 */
export function runWorkflow(opts = {}) {
  const workflow_id = opts.workflow_id || "";
  const mode = opts.mode === "live" ? "live" : "dry_run";
  const correlation_id = opts.correlation_id || "";
  const actor = opts.actor || "system";

  if (!workflow_id) {
    return {
      ok: false,
      workflow_id: "",
      mode,
      steps: [{ step_id: "validate", status: "failed" }],
      artifacts: []
    };
  }

  // dry_run: no external I/O, deterministic stub result
  if (mode === "dry_run") {
    return {
      ok: true,
      workflow_id,
      mode: "dry_run",
      steps: [
        { step_id: "validate", status: "ok" },
        { step_id: "execute_stub", status: "ok", correlation_id, actor }
      ],
      artifacts: [{ artifact_id: `dryrun:${workflow_id}:${Date.now()}`, kind: "audit_log" }]
    };
  }

  // live: placeholder for future real execution (still no I/O in this file for AE)
  return {
    ok: true,
    workflow_id,
    mode: "live",
    steps: [{ step_id: "validate", status: "ok" }],
    artifacts: []
  };
}
