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
  const a: any = __readCacheAuditSystem();

  host.innerHTML = "";

  const card = __el("div", { style: {
    border: "1px solid rgba(255,255,255,0.12)",
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
      border: "1px solid rgba(255,255,255,0.16)",
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
