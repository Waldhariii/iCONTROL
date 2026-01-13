import { recordObs } from "./audit";
import { OBS } from "./obsCodes";
import { navigate } from "/src/runtime/navigate";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text !== undefined) node.textContent = text;
  return node;
}

export function sectionCard(title: string): HTMLDivElement {
  const card = el("div");
  card.style.cssText = [
    "margin:14px 0",
    "padding:14px",
    "border-radius:16px",
    "border:1px solid var(--line)",
    "background:rgba(255,255,255,0.03)"
  ].join(";");

  const h = el("div", undefined, title);
  h.style.cssText = "font-weight:800;margin-bottom:10px";
  card.appendChild(h);
  return card;
}

export function appendParagraph(host: HTMLElement, text: string): void {
  const p = el("div", undefined, text);
  p.style.cssText = "opacity:.8;line-height:1.4";
  host.appendChild(p);
}

export function appendList(host: HTMLElement, items: string[]): void {
  const ul = el("ul");
  ul.style.cssText = "margin:0;padding-left:18px;opacity:.9";
  items.forEach((item) => ul.appendChild(el("li", undefined, item)));
  host.appendChild(ul);
}

export function appendKeyValueTable(host: HTMLElement, rows: Array<{ key: string; value: string }>): void {
  const table = el("table");
  table.style.cssText = "width:100%;border-collapse:collapse";

  rows.forEach((r) => {
    const tr = el("tr");
    const tdKey = el("td", undefined, r.key);
    tdKey.style.cssText = "padding:8px;border-bottom:1px solid var(--line);opacity:.85;width:40%";
    const tdVal = el("td", undefined, r.value);
    tdVal.style.cssText = "padding:8px;border-bottom:1px solid var(--line)";
    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    table.appendChild(tr);
  });

  host.appendChild(table);
}

export function appendTable(
  host: HTMLElement,
  columns: string[],
  rows: Array<Record<string, string>>
): void {
  const maxRows = 200;
  const safeRows = rows.slice(0, maxRows);
  const table = el("table");
  table.style.cssText = "width:100%;border-collapse:collapse";

  const thead = el("thead");
  const trh = el("tr");
  columns.forEach((c) => {
    const th = el("th", undefined, c);
    th.style.cssText = "text-align:left;padding:8px;border-bottom:1px solid var(--line);font-size:12px;opacity:.85";
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = el("tbody");
  if (safeRows.length === 0) {
    const tr = el("tr");
    const td = el("td", undefined, "Aucune donnée");
    td.style.cssText = "padding:8px;border-bottom:1px solid var(--line);opacity:.7";
    td.colSpan = columns.length || 1;
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  safeRows.forEach((row) => {
    const tr = el("tr");
    columns.forEach((c) => {
      const td = el("td", undefined, row[c] ?? "");
      td.style.cssText = "padding:8px;border-bottom:1px solid var(--line)";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  host.appendChild(table);

  if (rows.length > maxRows) {
    const note = el("div", undefined, `Affichage limité à ${maxRows} lignes (sur ${rows.length}).`);
    note.style.cssText = "margin-top:8px;opacity:.7;font-size:12px";
    host.appendChild(note);
  }
}

export type UiAction = {
  id: string;
  label: string;
  type: "navigate" | "exportCsv" | "noop";
  payload?: string;
};

export function appendActionRow(host: HTMLElement, actions: UiAction[]): HTMLDivElement {
  const row = el("div");
  row.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:10px";
  actions.forEach((action) => {
    const btn = el("button", { type: "button", "data-action-id": action.id }, action.label);
    btn.setAttribute("aria-label", action.label);
    btn.style.cssText = [
      "padding:8px 12px",
      "border-radius:10px",
      "border:1px solid var(--line)",
      "background:rgba(255,255,255,0.04)",
      "color:inherit",
      "cursor:pointer"
    ].join(";");
    row.appendChild(btn);
  });
  host.appendChild(row);
  return row;
}

export function bindActions(
  row: HTMLElement,
  actions: UiAction[],
  opts: { allowRoutes: string[]; exportRows?: Array<Record<string, string>> }
): void {
  const maxExportRows = 200;
  const actionMap = new Map(actions.map((a) => [a.id, a]));
  row.querySelectorAll<HTMLButtonElement>("button[data-action-id]").forEach((btn) => {
    const id = btn.getAttribute("data-action-id") || "";
    const action = actionMap.get(id);
    if (!action) return;
    btn.addEventListener("click", () => {
      if (action.type === "navigate") {
        const target = action.payload || "#/dashboard";
        if (!opts.allowRoutes.includes(target)) {
          recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: action.id, detail: "route_not_allowed" });
          return;
        }
  navigate(target);
        recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: action.id, detail: `navigate:${target}` });
        return;
      }
      if (action.type === "exportCsv") {
        // ICONTROL_SAFE_EXPORT_V1: block exports in SAFE_MODE strict.
        const safeMode = (globalThis as any).ICONTROL_SAFE_MODE;
        if (safeMode === "STRICT") {
          recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: action.id, detail: "safeMode_export_blocked" });
          return;
        }
        const rows = opts.exportRows || [];
        if (!rows.length) {
          recordObs({ code: OBS.WARN_EXPORT_EMPTY, actionId: action.id, detail: "export_empty" });
          return;
        }
        const built = buildCsv(rows, maxExportRows);
        const blob = new Blob([built.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = el("a", { href: url, download: `export_${action.id}.csv` });
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        recordObs({
          code: OBS.WARN_ACTION_EXECUTED,
          actionId: action.id,
          detail: `exportCsv:rows=${built.rowCount}`
        });
        return;
      }
      recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: action.id, detail: "noop" });
    });
  });
}

export function buildCsv(
  rows: Array<Record<string, string>>,
  maxRows = 200
): { csv: string; rowCount: number } {
  const slice = rows.slice(0, maxRows);
  const cols = slice.length ? Object.keys(slice[0]) : [];
  const header = cols.join(",");
  const body = slice.map((r) => cols.map((c) => String(r[c] ?? "")).join(",")).join("\n");
  const csv = body ? `${header}\n${body}` : header;
  return { csv, rowCount: slice.length };
}

export function appendPillRow(host: HTMLElement, items: string[]): void {
  const wrap = el("div");
  wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
  items.forEach((item) => {
    const pill = el("span", undefined, item);
    pill.style.cssText = [
      "padding:4px 10px",
      "border-radius:999px",
      "border:1px solid var(--line)",
      "background:rgba(255,255,255,0.04)",
      "font-size:12px"
    ].join(";");
    wrap.appendChild(pill);
  });
  host.appendChild(wrap);
}

/* ===== ICONTROL_BLOCK_TOGGLE_V1 ===== */
export function blockToggle(args: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "cxCard";

  const title = document.createElement("div");
  title.className = "cxTitle";
  title.textContent = args.label;
  wrap.appendChild(title);

  if (args.description) {
    const desc = document.createElement("div");
    desc.className = "smallMuted";
    desc.textContent = args.description;
    wrap.appendChild(desc);
  }

  const row = document.createElement("div");
  row.className = "cxRow";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = args.id;
  input.checked = !!args.checked;
  input.disabled = !!args.disabled;
  input.setAttribute("aria-label", args.label);

  const label = document.createElement("label");
  label.className = "smallMuted";
  label.htmlFor = args.id;
  label.textContent = input.disabled ? "Desactive" : input.checked ? "Active" : "Desactive";

  input.addEventListener("change", () => {
    const next = input.checked;
    label.textContent = input.disabled ? "Desactive" : next ? "Active" : "Desactive";
    recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: `toggle:${args.id}`, detail: String(next) });
    args.onChange(next);
  });

  row.appendChild(input);
  row.appendChild(label);
  wrap.appendChild(row);
  return wrap;
}

/* ===== ICONTROL_BLOCK_KEYVALUE_TABLE_V1 ===== */
export function blockKeyValueTable(args: {
  title: string;
  rows: Array<{ key: string; value: string }>;
}): HTMLElement {
  const card = sectionCard(args.title);
  appendTable(
    card,
    ["Cle", "Valeur"],
    args.rows.map((r) => ({ Cle: r.key, Valeur: r.value }))
  );
  return card;
}

/* ===== ICONTROL_ACTIONBAR_V1 ===== */
export type ActionBarItem = UiAction & {
  write?: boolean;
};

export function blockActionBar(args: {
  title?: string;
  actions: ActionBarItem[];
  allowRoutes: string[];
  exportRows?: Array<Record<string, string>>;
  role?: string;
  allowedRoles?: string[];
  safeMode?: "STRICT" | "COMPAT";
  onAction?: (action: ActionBarItem) => void;
}): HTMLElement {
  const card = sectionCard(args.title || "Actions");
  const row = appendActionRow(card, args.actions);
  const actionMap = new Map(args.actions.map((a) => [a.id, a]));
  const safeMode = args.safeMode || "COMPAT";

  row.querySelectorAll<HTMLButtonElement>("button[data-action-id]").forEach((btn) => {
    const id = btn.getAttribute("data-action-id") || "";
    const action = actionMap.get(id);
    if (!action) return;

    const requiresWrite = Boolean(action.write);
    const roleBlocked = Boolean(
      requiresWrite &&
      args.allowedRoles &&
      args.role &&
      !args.allowedRoles.includes(args.role)
    );
    const strictBlocked = safeMode === "STRICT" && (requiresWrite || action.type === "exportCsv");

    if (strictBlocked && requiresWrite) {
      btn.style.display = "none";
      btn.setAttribute("data-blocked", "safeModeStrict");
      return;
    }

    if (strictBlocked) {
      btn.setAttribute("data-blocked", "safeModeStrict");
      btn.style.opacity = "0.6";
      btn.title = "Bloque en SAFE_MODE strict";
    }

    if (roleBlocked) {
      btn.setAttribute("data-blocked", "rbac");
      btn.style.opacity = "0.6";
      btn.title = "Bloque par RBAC";
    }

    btn.addEventListener("click", () => {
      if (strictBlocked) {
        recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: action.id, detail: "safeModeStrict" });
        return;
      }
      if (roleBlocked) {
        recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: action.id, detail: "rbac" });
        return;
      }
      if (action.type === "navigate") {
        const target = action.payload || "#/dashboard";
        if (!args.allowRoutes.includes(target)) {
          recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: action.id, detail: "route_not_allowed" });
          return;
        }
  navigate(target);
        recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: action.id, detail: `navigate:${target}` });
        return;
      }
      if (action.type === "exportCsv") {
        const rows = args.exportRows || [];
        if (!rows.length) {
          recordObs({ code: OBS.WARN_EXPORT_EMPTY, actionId: action.id, detail: "export_empty" });
          return;
        }
        const built = buildCsv(rows, 200);
        const blob = new Blob([built.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = el("a", { href: url, download: `export_${action.id}.csv` });
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: action.id, detail: `exportCsv:rows=${built.rowCount}` });
        return;
      }
      if (action.write) {
        if (args.onAction) args.onAction(action);
        else recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: action.id, detail: "write_no_handler" });
        return;
      }
      recordObs({ code: OBS.WARN_ACTION_EXECUTED, actionId: action.id, detail: "noop" });
      if (args.onAction) args.onAction(action);
    });
  });

  return card;
}

/* ===== ICONTROL_TOAST_V1 ===== */
export function blockToast(message: string, kind: "ok" | "warn" | "error" = "ok"): HTMLElement {
  const toast = el("div");
  toast.style.cssText = [
    "margin:8px 0",
    "padding:8px 10px",
    "border-radius:10px",
    "border:1px solid var(--line)",
    "background:rgba(255,255,255,0.03)",
    "font-size:12px",
    "opacity:.9"
  ].join(";");
  if (kind === "warn") toast.style.borderColor = "#b58a00";
  if (kind === "error") toast.style.borderColor = "#c33";
  toast.textContent = message;
  return toast;
}

/* ===== ICONTROL_FILTER_V1 ===== */
export function blockFilterInput(args: {
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = args.placeholder;
  input.value = args.value;
  input.style.cssText = "padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:transparent;color:inherit;";
  input.addEventListener("input", () => args.onChange(input.value));
  return input;
}
