import type { RenderPlan, RenderOp } from "./plan";
import type { RuntimeResult } from "./result";
import { err, ok } from "./result";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function executePlan(plan: RenderPlan): RuntimeResult<string> {
  try {
    let out = "";
    for (const op of plan.ops) out += renderOp(op);
    return ok(out);
  } catch (e) {
    return err("internal_error", e instanceof Error ? e.message : "unknown");
  }
}

function renderOp(op: RenderOp): string {
  if (op.op === "text") return `<pre>${escapeHtml(op.value)}</pre>`;
  if (op.op === "component") {
    // Placeholder until registry wiring
    return `<div data-component="${escapeHtml(op.id)}">component:${escapeHtml(op.id)}</div>`;
  }
  const _never: never = op;
  return `<pre>invalid_op</pre>`;
}
