import { OBS } from "../../_shared/obsCodes";
import { recordObs } from "../../_shared/audit";

function __redactAudit(input: any): any {
  // Policy: allowlist only schema/version/toggles/timestamp (future-proof, JSON-safe)
  const a = input && typeof input === "object" ? input : {};
  return {
    schemaVersion: typeof a.schemaVersion === "number" ? a.schemaVersion : 1,
    ts: typeof a.ts === "number" ? a.ts : Date.now(),
    swrDisabled: !!a.swrDisabled,
    metricsDisabled: !!a.metricsDisabled,
  };
}

async function __copyRedactedJson(snap: any): Promise<boolean> {
  try {
    const redacted = __redactAudit(snap);
    const json = JSON.stringify(redacted, null, 2);
    const nav: any = (globalThis as any).navigator;
    if (!nav?.clipboard?.writeText) return false;
    await nav.clipboard.writeText(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * P1.5 | System Cache Audit section (read-only)
 * - DOM-based renderer (no JSX)
 * - Uses globalThis.__cacheAudit (P1.4 guarantees snapshot()) but stays best-effort
 * - Provides "Copy JSON" to clipboard with safe fallback
 */
function __fmtTs(ts?: number): string {
  try { return ts ? new Date(ts).toLocaleString() : "n/a"; } catch { return "n/a"; }
}

function __readCacheAuditSystem(): any | undefined {
  try {
    const w: any = globalThis as any;
    const a: any = w?.__cacheAudit;
    if (!a) return undefined;
    if (typeof a.snapshot === "function") return a.snapshot();
    return {
      schemaVersion: a.schemaVersion,
      ts: a.ts,
      swrDisabled: a.swrDisabled,
      metricsDisabled: a.metricsDisabled,
    };
  } catch {
    return undefined;
  }
}

async function __copyJson(obj: any): Promise<boolean> {
  try {
    const text = JSON.stringify(obj ?? null, null, 2);
    const nav: any = (typeof navigator !== "undefined" ? navigator : undefined);
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
    if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    }
    return false;
  } catch {
    return false;
  }
}

function __el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Record<string, any>, children?: Array<Node | string>): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "style" && v && typeof v === "object") Object.assign((e as any).style, v);
      else if (k === "className") (e as any).className = v;
      else if (k.startsWith("on") && typeof v === "function") (e as any)[k.toLowerCase()] = v;
      else if (v !== undefined) e.setAttribute(k, String(v));
    }
  }
  if (children) {
    for (const c of children) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

export function renderSystemCacheAudit(host: HTMLElement): void {
  // P1.8_AUDIT_REFRESH_OBS: emit refresh OBS on user action (best-effort, no-throw)
  const __emitRefresh = (detail: string) => {
    try {
      const w = globalThis as any;
      const ro = (typeof (w?.recordObs) === "function") ? w.recordObs : null;
      if (ro) ro({ code: OBS.AUDIT_CACHE_REFRESH, page: "system", section: "cache-audit", detail });
    } catch {}
  };

  // P1.7_PREFER_REDACTED_SNAPSHOT: prefer policy-provided redactedSnapshot() when present
  const __getSnapshot = (audit: any) => {
    try {
      if (audit && typeof audit.redactedSnapshot === "function") return audit.redactedSnapshot();
      if (audit && typeof audit.snapshot === "function") return audit.snapshot();
    } catch {}
    return null;
  };

  const a: any = __readCacheAuditSystem();

  
  const w: any = globalThis as any;
  const snap = (() => {
    try {
      const a = w.__cacheAudit;
      if (a?.snapshot) return a.snapshot();
      return a || null;
    } catch { return null; }
  })();

host.innerHTML = "";

  // P1.6_ACTION_ROW: actions (best-effort)
  try {
    const actions = document.createElement("div");
    actions.setAttribute("data-kind", "audit-actions");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.marginTop = "10px";

    const btnRefresh = document.createElement("button");
    btnRefresh.type = "button";
    btnRefresh.textContent = "Refresh";
    btnRefresh.onclick = () => { __emitRefresh("click"); renderSystemCacheAudit(host); };

    const btnCopy = document.createElement("button");
    btnCopy.type = "button";
    btnCopy.textContent = "Copy redacted JSON";
    btnCopy.onclick = async () => {
      const ok = await __copyRedactedJson(snap);
      try { recordObs({ code: OBS.AUDIT_CACHE_COPY, page: "system", section: "cache-audit", detail: ok ? "ok" : "fail" }); } catch {}
    };

    host.appendChild(actions);
    actions.appendChild(btnRefresh);
    actions.appendChild(btnCopy);
  } catch {}


  const card = __el("div", { style: {
    border: "1px solid var(--ic-borderLight)",
    borderRadius: "12px",
    padding: "12px",
  }});

  const header = __el("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }});
  const left = __el("div");
  left.appendChild(__el("div", { style: { fontWeight: "700" } }, ["System Cache Audit"]));
  left.appendChild(__el("div", { style: { opacity: "0.8", fontSize: "12px" } }, [a?.ts ? __fmtTs(a.ts) : "n/a"]));

  const btn = __el("button", {
    type: "button",
    style: {
      border: "1px solid var(--ic-borderLightStrong)",
      background: "transparent",
      color: "inherit",
      borderRadius: "10px",
      padding: "6px 10px",
      cursor: "pointer",
      fontSize: "12px",
      opacity: "0.9",
    },
    onclick: async () => { try { await __copyJson(a); } catch {} },
    title: "Copy audit snapshot JSON",
  }, ["Copy JSON"]);

  header.appendChild(left);
  header.appendChild(btn);

  const grid = __el("div", { style: {
    marginTop: "10px",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    fontSize: "13px",
  }});

  function row(label: string, value: string) {
    const lab = __el("span", { style: { opacity: "0.7" } }, [label + ": "]);
    const val = __el("span", {}, [value]);
    const wrap = __el("div");
    wrap.appendChild(lab);
    wrap.appendChild(val);
    return wrap;
  }

  grid.appendChild(row("schemaVersion", (typeof a?.schemaVersion === "number") ? String(a.schemaVersion) : "n/a"));
  grid.appendChild(row("swrDisabled", (typeof a?.swrDisabled === "boolean") ? String(a.swrDisabled) : "n/a"));
  grid.appendChild(row("metricsDisabled", (typeof a?.metricsDisabled === "boolean") ? String(a.metricsDisabled) : "n/a"));
  grid.appendChild(row("surface", a ? "present" : "absent"));

  const foot = __el("div", { style: { marginTop: "8px", opacity: "0.7", fontSize: "12px" }}, [
    "Read-only governance surface. Snapshot is JSON-safe. Best-effort display."
  ]);

  card.appendChild(header);
  card.appendChild(grid);
  card.appendChild(foot);

  host.appendChild(card);
}
