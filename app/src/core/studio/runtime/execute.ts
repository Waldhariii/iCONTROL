import { applyVersionPolicyBootGuards } from "../../../policies/version_policy.runtime";
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
  const normalized = normalizeTable(props);
  const title = typeof props.title === "string" ? props.title : "Table";
  const caption = typeof (props as any).caption === "string" ? (props as any).caption : "";
  const emptyText = typeof (props as any).emptyText === "string" ? (props as any).emptyText : "(empty)";

  const columns = normalized.columns;
  const rows = normalized.rows;
  const maxRows = 200;
  const sliced = rows.slice(0, maxRows);
  const truncated = rows.length > maxRows;

  const thead = columns.length
    ? `<thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>`
    : "";

  const tbody = sliced.length
    ? `<tbody>${sliced.map((r) => {
        const cells = (columns.length ? columns : Object.keys(r)).map((col) => {
          const v = (r as any)[col];
          return `<td>${escapeHtml(v == null ? "" : String(v))}</td>`;
        }).join("");
        return `<tr>${cells}</tr>`;
      }).join("")}</tbody>`
    : `<tbody><tr><td>${escapeHtml(emptyText)}</td></tr></tbody>`;

  const note = truncated
    ? `<div style="opacity:.7;margin-top:6px;">${escapeHtml("(truncated)")}</div>`
    : "";

  return [
    `<section data-builtin="table" style="margin:8px 0;">`,
    `<div style="font-weight:600;margin:0 0 6px 0;">${escapeHtml(title)}</div>`,
    `<table class="cxTable" style="width:100%;border-collapse:collapse;">`,
    caption ? `<caption style="caption-side:bottom;opacity:.7;padding-top:6px;">${escapeHtml(caption)}</caption>` : "",
    thead,
    tbody,
    `</table>`,
    note,
    `</section>`
  ].join("");
}

function normalizeTable(input: Record<string, unknown>): { columns: string[]; rows: Array<Record<string, unknown>> } {
  const rawColumns = (input as any).columns;
  const rawRows = (input as any).rows;

  let columns: string[] = [];
  if (Array.isArray(rawColumns)) {
    if (rawColumns.length > 0 && isObj(rawColumns[0])) {
      columns = rawColumns
        .map((c: any) => typeof c?.label === "string" ? c.label : c?.key)
        .filter((c: any) => typeof c === "string") as string[];
    } else {
      columns = rawColumns.map((c: any) => String(c));
    }
  }

  let rows: Array<Record<string, unknown>> = [];
  if (Array.isArray(rawRows)) {
    if (rawRows.length > 0 && Array.isArray(rawRows[0])) {
      rows = rawRows.map((r: unknown[]) => {
        const obj: Record<string, unknown> = {};
        columns.forEach((col, idx) => {
          obj[col] = r[idx];
        });
        return obj;
      });
    } else {
      rows = rawRows.map((r: unknown) => (isObj(r) ? r : { value: r }));
    }
  }

  if (!columns.length && rows.length > 0) {
    columns = Object.keys(rows[0] || {});
  }

  return { columns, rows };
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
