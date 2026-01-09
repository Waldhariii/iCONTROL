import type { RenderOp, RenderPlan } from "./types";
import { ok, err } from "./result";
import { escapeHtml } from "./internal/escape";

/**
 * Registry contract (kept tiny to avoid coupling).
 * - resolve(id) returns a renderable function (optional).
 * - For now, we render placeholders safely when not resolvable.
 */
export type RegistryLike = {
  resolve?: (id: string) => ((props: Record<string, unknown>) => unknown) | undefined;
};

export function executePlan(plan: RenderPlan, deps?: { registry?: RegistryLike }): ReturnType<typeof ok<string> | typeof err> {
  try {
    let out = "";
    for (const op of plan.ops) out += renderOp(op, deps?.registry);
    return ok(out);
  } catch (e) {
    return err("internal_error", e instanceof Error ? e.message : "unknown");
  }
}

function renderOp(op: RenderOp, registry?: RegistryLike): string {
  if (op.op === "text") return `<pre>${escapeHtml(op.value)}</pre>`;

  if (op.op === "component") {
    const id = String(op.id ?? "");
    const r = registry?.resolve?.(id);

    // If registry can resolve, we still return a safe placeholder HTML for now,
    // because the core runtime is string-based. Later we can evolve to React rendering.
    if (r) {
      return `<div data-component="${escapeHtml(id)}">component:${escapeHtml(id)}:resolved</div>`;
    }
    return `<div data-component="${escapeHtml(id)}">component:${escapeHtml(id)}</div>`;
  }

  const _never: never = op;
  return `<pre>invalid_op</pre>`;
}
