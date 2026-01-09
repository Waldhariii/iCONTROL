import type { RenderOp, RenderPlan } from "./types";
import { ok, err } from "./result";
import { escapeHtml } from "./internal/escape";
import { CODES } from "../internal/codes";
import { getSafeMode, isBuiltinId } from "../internal/policy";
import type { Claims } from "../internal/rbac";
import { hasAllPermissions } from "../internal/rbac";

/**
 * Registry contract (kept tiny to avoid coupling).
 * - resolve(id) returns a renderable function (optional).
 * - Core runtime is string-based, so builtins must render to safe HTML.
 */
export type RegistryLike = {
  resolve?: (id: string) => ((props: Record<string, unknown>) => unknown) | undefined;
};

export function executePlan(
  plan: RenderPlan,
  deps?: { registry?: RegistryLike; claims?: Claims }
): ReturnType<typeof ok<string> | typeof err> {
  try {
    if (!hasAllPermissions(deps?.claims, plan.requires)) {
      return err("forbidden", CODES.ERR_FORBIDDEN);
    }
    let out = "";
    for (const op of plan.ops) out += renderOp(op, deps?.registry);
    return ok(out);
  } catch (e) {
    return err("internal_error", e instanceof Error ? e.message : CODES.ERR_INTERNAL);
  }
}

function renderOp(op: RenderOp, registry?: RegistryLike): string {
  if (op.op === "text") {
    // Keep text safe + readable
    return `<pre>${escapeHtml(String(op.value ?? ""))}</pre>`;
  }

  if (op.op === "component") {
    const id = String(op.id ?? "");
    const props = (op.props && typeof op.props === "object") ? op.props : {};

    // 1) First-class builtins (framework-agnostic rendering)
    const mode = getSafeMode();
    if (mode === "STRICT" && !isBuiltinId(id)) {
      return `<div data-error="${escapeHtml(CODES.ERR_FORBIDDEN)}">forbidden_component:${escapeHtml(id)}</div>`;
    }
    if (id === "builtin.table") return renderBuiltinTable(props);
    if (id === "builtin.form") return renderBuiltinForm(props);

    // 2) Registry resolution (optional)
    if (!registry?.resolve) {
      return `<div data-component="${escapeHtml(id)}" data-warn="${escapeHtml(CODES.WARN_REGISTRY_MISS)}">component:${escapeHtml(id)}</div>`;
    }
    const r = registry?.resolve?.(id);
    if (r) {
      const result = safeCall(() => r(props));
      if (result === undefined) {
        return `<div data-component="${escapeHtml(id)}" data-warn="${escapeHtml(CODES.WARN_REGISTRY_THROW)}">component:${escapeHtml(id)}:error</div>`;
      }

      // If registry returns a builtin payload, render it
      if (isObj(result) && typeof (result as any).kind === "string") {
        const k = String((result as any).kind);
        if (k === "TABLE") return renderBuiltinTable(result as any);
        if (k === "FORM") return renderBuiltinForm(result as any);
      }

      // If registry returns a string, treat as *untrusted* and escape
      if (typeof result === "string") {
        return `<div data-component="${escapeHtml(id)}">${escapeHtml(result)}</div>`;
      }

      // Default: resolved but no renderable payload
      return `<div data-component="${escapeHtml(id)}">component:${escapeHtml(id)}:resolved</div>`;
    }

    // 3) Unresolved
    return `<div data-component="${escapeHtml(id)}" data-warn="${escapeHtml(CODES.WARN_REGISTRY_MISS)}">component:${escapeHtml(id)}</div>`;
  }

  const _never: never = op;
  return `<pre>invalid_op</pre>`;
}

/* =========================
   Builtin renderers
   ========================= */

function renderBuiltinTable(props: Record<string, unknown>): string {
  const title = typeof props.title === "string" ? props.title : "Table";
  const columns = Array.isArray(props.columns) ? props.columns.map(String) : [];
  const rows = Array.isArray(props.rows) ? (props.rows as Array<Record<string, unknown>>) : [];

  const thead = columns.length
    ? `<thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>`
    : "";

  const tbody = rows.length
    ? `<tbody>${rows.map((r) => {
        const cells = (columns.length ? columns : Object.keys(r)).map((col) => {
          const v = (r as any)[col];
          return `<td>${escapeHtml(v == null ? "" : String(v))}</td>`;
        }).join("");
        return `<tr>${cells}</tr>`;
      }).join("")}</tbody>`
    : `<tbody><tr><td>${escapeHtml("(empty)")}</td></tr></tbody>`;

  return [
    `<section data-builtin="table" style="margin:8px 0;">`,
    `<div style="font-weight:600;margin:0 0 6px 0;">${escapeHtml(title)}</div>`,
    `<table style="width:100%;border-collapse:collapse;">`,
    thead,
    tbody,
    `</table>`,
    `</section>`
  ].join("");
}

function renderBuiltinForm(props: Record<string, unknown>): string {
  const title = typeof props.title === "string" ? props.title : "Form";
  const fields = Array.isArray(props.fields) ? props.fields : [];

  const body = fields.length
    ? fields.map((f, i) => {
        const o = isObj(f) ? f : {};
        const name = typeof (o as any).name === "string" ? (o as any).name : `field_${i+1}`;
        const label = typeof (o as any).label === "string" ? (o as any).label : name;
        const type = typeof (o as any).type === "string" ? (o as any).type : "text";

        // Conservative types only
        const safeType = ["text","email","number","password","date","tel"].includes(type) ? type : "text";

        return [
          `<div style="margin:0 0 10px 0;">`,
          `<label style="display:block;font-size:12px;opacity:0.9;margin:0 0 4px 0;">${escapeHtml(label)}</label>`,
          `<input name="${escapeHtml(name)}" type="${escapeHtml(safeType)}"`,
          ` style="width:100%;padding:8px;border-radius:8px;border:1px solid #666;background:transparent;color:inherit;" />`,
          `</div>`
        ].join("");
      }).join("")
    : `<div style="opacity:0.8;">${escapeHtml("(no fields)")}</div>`;

  return [
    `<section data-builtin="form" style="margin:8px 0;">`,
    `<div style="font-weight:600;margin:0 0 6px 0;">${escapeHtml(title)}</div>`,
    `<form>`,
    body,
    `<button type="button" style="padding:8px 12px;border-radius:10px;border:1px solid #666;background:transparent;color:inherit;cursor:pointer;">Submit</button>`,
    `</form>`,
    `</section>`
  ].join("");
}

/* =========================
   Utilities
   ========================= */

function safeCall<T>(fn: () => T): T | undefined {
  try { return fn(); } catch { return undefined; }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
