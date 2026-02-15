/**
 * Action bus (declarative): safe action kinds only; policy_id required; no custom handlers in UI.
 */

export const SAFE_ACTION_KINDS = ["navigate", "open_modal", "submit_form", "call_workflow", "export_pdf"];

/**
 * @param {{ action_id: string, kind: string, policy_id: string, input_schema_ref?: string, handler_ref?: string }} spec
 * @param {{ correlation_id?: string, tenant_id?: string }} context
 * @returns {{ ok: boolean, refused?: boolean, reason?: string }}
 */
export function dispatchAction(spec, context = {}) {
  if (!spec || typeof spec.kind !== "string") {
    return { ok: false, refused: true, reason: "action_spec_required" };
  }
  if (!SAFE_ACTION_KINDS.includes(spec.kind)) {
    return { ok: false, refused: true, reason: "action_kind_unknown" };
  }
  if (!spec.policy_id || typeof spec.policy_id !== "string") {
    return { ok: false, refused: true, reason: "policy_id_required" };
  }
  return { ok: true, correlation_id: context.correlation_id };
}

export function isKnownKind(kind) {
  return SAFE_ACTION_KINDS.includes(kind);
}
