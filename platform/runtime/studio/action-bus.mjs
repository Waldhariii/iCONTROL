/**
 * Action bus (declarative): safe action kinds only; policy_id required; export_pdf routes to workflow execute.
 */
import { runWorkflow } from "./workflow-runner.mjs";

export const SAFE_ACTION_KINDS = ["navigate", "open_modal", "submit_form", "call_workflow", "export_pdf"];

/** Default workflow for export_pdf when no page_id mapping. */
const DEFAULT_EXPORT_PDF_WORKFLOW_ID = "workflow:pdf_export_invoice";

/**
 * @param {{ action_id: string, kind: string, policy_id: string, input_schema_ref?: string, handler_ref?: string }} spec
 * @param {{ correlation_id?: string, tenant_id?: string, request_id?: string, release_id?: string, actor?: string, reports_dir?: string, artifacts_base_dir?: string, page_id?: string, safe_mode?: boolean }} context
 * @returns {Promise<{ ok: boolean, refused?: boolean, reason?: string, correlation_id?: string, workflow_result?: object }>}
 */
export async function dispatchAction(spec, context = {}) {
  if (!spec || typeof spec.kind !== "string") {
    return { ok: false, refused: true, reason: "action_spec_required" };
  }
  if (!SAFE_ACTION_KINDS.includes(spec.kind)) {
    return { ok: false, refused: true, reason: "action_kind_unknown" };
  }
  if (!spec.policy_id || typeof spec.policy_id !== "string") {
    return { ok: false, refused: true, reason: "policy_id_required" };
  }

  if (spec.kind === "export_pdf") {
    const workflow_id = context.page_id ? getWorkflowIdForPage(context.page_id) : DEFAULT_EXPORT_PDF_WORKFLOW_ID;
    const result = await runWorkflow({
      workflow_id,
      mode: "execute",
      correlation_id: context.correlation_id || "",
      actor: context.actor || "system",
      reports_dir: context.reports_dir || "",
      artifacts_base_dir: context.artifacts_base_dir || "",
      tenant_id: context.tenant_id,
      release_id: context.release_id,
      request_id: context.request_id,
      safe_mode: context.safe_mode,
      inputs: context.inputs || {}
    });
    return { ok: result.ok, correlation_id: context.correlation_id, workflow_result: result };
  }

  return { ok: true, correlation_id: context.correlation_id };
}

/** Optional mapping page_id -> workflow_id (SSOT-driven later). */
function getWorkflowIdForPage(page_id) {
  const MAP = {
    "page:pdf_exports": "workflow:pdf_export_invoice",
    "page:documents": "workflow:pdf_export_report"
  };
  return MAP[page_id] || DEFAULT_EXPORT_PDF_WORKFLOW_ID;
}

export function isKnownKind(kind) {
  return SAFE_ACTION_KINDS.includes(kind);
}
