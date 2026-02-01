/**
 * DEV-only UI Showcase (SSOT-friendly)
 * - Aucun routing
 * - Aucune écriture hash/location
 * - Safe en Vitest Node (no-op sans window/document)
 * - Activation explicite via localStorage: icontrol_showcase=1
 */

function getGlobal(): any {
  return globalThis as any;
}

function isDev(): boolean {
  return !!(import.meta as any).env?.DEV;
}

function hasBrowser(): boolean {
  const g = getGlobal();
  return !!g.window && !!g.document;
}

function isEnabled(): boolean {
  const g = getGlobal();
  const w = g.window as any;
  try {
    return w?.localStorage?.getItem("icontrol_showcase") === "1";
  } catch {
    return false;
  }
}

function ensureStyles(doc: Document): void {
  if (doc.getElementById("icontrol-showcase-style")) return;
  const style = doc.createElement("style");
  style.id = "icontrol-showcase-style";
  style.textContent = `
  .ic-showcase {
    position: fixed; inset: 16px; z-index: 2147483000;
    background: color-mix(in srgb, var(--ic-bg) 92%, transparent);
    border: 1px solid var(--ic-border, var(--ic-text-muted));
    border-radius: 16px;
    box-shadow: var(--ic-shadowToast, 0 18px 46px var(--ic-text-muted));
    color: var(--ic-text);
    font-family: var(--font, var(--ic-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial));
    overflow: hidden;
  }
  .ic-showcase__top {
    display:flex; align-items:center; justify-content:space-between;
    padding: 12px 14px;
    background: var(--ic-panel);
    border-bottom: 1px solid var(--ic-border, var(--ic-text-muted));
  }
  .ic-showcase__title { font-weight: 800; letter-spacing: .3px; font-size: 13px; }
  .ic-showcase__btn {
    padding: 8px 10px; border-radius: 10px;
    border: 1px solid var(--ic-border, var(--ic-text-muted));
    background: transparent; color: inherit; cursor: pointer;
    font-weight: 700; font-size: 12px;
  }
  .ic-showcase__grid {
    display:grid; grid-template-columns: 1.2fr .8fr; gap: 12px;
    padding: 12px;
    height: calc(100% - 52px);
    background: var(--ic-bg);
  }
  .ic-showcase__card {
    border-radius: 14px;
    border: 1px solid var(--ic-border, var(--ic-text-muted));
    background: var(--ic-card);
    padding: 12px;
  }
  .ic-showcase__h { font-weight: 900; font-size: 12px; opacity: .95; margin-bottom: 8px; }
  .ic-showcase__row { display:flex; gap: 8px; flex-wrap: wrap; align-items:center; }
  .ic-showcase__input {
    height: 36px; padding: 0 12px; border-radius: 10px;
    background: var(--ic-inputBg, var(--ic-text-muted));
    border: 1px solid var(--ic-border, var(--ic-text-muted));
    color: var(--ic-text);
    outline: none;
    min-width: 240px;
  }
  .ic-showcase__cta {
    height: 36px; padding: 0 12px; border-radius: 10px;
    border: 1px solid transparent;
    background: var(--ic-accent);
    color: var(--ic-textOnAccent);
    font-weight: 900; cursor: pointer;
  }
  .ic-showcase__ghost {
    height: 36px; padding: 0 12px; border-radius: 10px;
    border: 1px solid var(--ic-border, var(--ic-text-muted));
    background: transparent;
    color: var(--ic-text);
    font-weight: 800; cursor: pointer;
  }
  table.ic-showcase__table { width:100%; border-collapse: collapse; font-size: 12px; }
  table.ic-showcase__table th, table.ic-showcase__table td {
    padding: 10px 10px;
    border-bottom: 1px solid var(--ic-border, var(--ic-text-muted));
    text-align: left;
  }
  table.ic-showcase__table th {
    background: var(--ic-panel);
    position: sticky; top: 0;
  }
  .ic-pill {
    display:inline-flex; align-items:center; padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--ic-accentBorder, var(--ic-text-muted));
    background: var(--ic-accentBg, var(--ic-text-muted));
    color: var(--ic-accent);
    font-weight: 800;
    font-size: 11px;
  }`;
  doc.head.appendChild(style);
}

function buildUI(doc: Document): HTMLElement {
  const wrap = doc.createElement("div");
  wrap.className = "ic-showcase";
  wrap.id = "__ICONTROL_SHOWCASE__";

  wrap.innerHTML = `
    <div class="ic-showcase__top">
      <div class="ic-showcase__title">UI Showcase (DEV-only) — SSOT Tokens & Vars</div>
      <div class="ic-showcase__row">
        <button class="ic-showcase__btn" data-action="refresh">Refresh</button>
        <button class="ic-showcase__btn" data-action="close">Close</button>
      </div>
    </div>

    <div class="ic-showcase__grid">
      <div class="ic-showcase__card">
        <div class="ic-showcase__h">Form Controls</div>
        <div class="ic-showcase__row">
          <input class="ic-showcase__input" placeholder="Recherche / filtre..." />
          <button class="ic-showcase__cta">Action primaire</button>
          <button class="ic-showcase__ghost">Secondaire</button>
          <span class="ic-pill">Status: OK</span>
        </div>

        <div style="height:12px"></div>

        <div class="ic-showcase__h">Table (Excel-like)</div>
        <div style="height: calc(100% - 110px); overflow:auto; border-radius: 12px; border:1px solid var(--ic-border, var(--ic-text-muted));">
          <table class="ic-showcase__table">
            <thead>
              <tr>
                <th>Client</th><th>Statut</th><th>Montant</th><th>Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Customer A</td><td><span class="ic-pill">Actif</span></td><td>2 450$</td><td>2026-01-28</td></tr>
              <tr><td>Innovex Extermination</td><td><span class="ic-pill">En cours</span></td><td>980$</td><td>2026-01-27</td></tr>
              <tr><td>Groupe Thermique</td><td><span class="ic-pill">Prospect</span></td><td>—</td><td>2026-01-25</td></tr>
              <tr><td>Client Démo</td><td><span class="ic-pill">Suspendu</span></td><td>120$</td><td>2026-01-22</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="ic-showcase__card">
        <div class="ic-showcase__h">Tokens snapshot</div>
        <div style="font-size:12px; opacity:.9; line-height:1.5">
          <div><b>--ic-bg</b>: <span data-var="--ic-bg"></span></div>
          <div><b>--ic-panel</b>: <span data-var="--ic-panel"></span></div>
          <div><b>--ic-card</b>: <span data-var="--ic-card"></span></div>
          <div><b>--ic-border</b>: <span data-var="--ic-border"></span></div>
          <div><b>--ic-text</b>: <span data-var="--ic-text"></span></div>
          <div><b>--ic-mutedText</b>: <span data-var="--ic-mutedText"></span></div>
          <div><b>--ic-accent</b>: <span data-var="--ic-accent"></span></div>
          <div><b>data-ic-theme-id</b>: <span data-meta="themeId"></span></div>
          <div><b>data-ic-theme-mode</b>: <span data-meta="themeMode"></span></div>
          <div><b>data-app-kind</b>: <span data-meta="appKind"></span></div>
          <div style="height:12px"></div>
          <div style="opacity:.75">Activation: <code>localStorage.setItem("icontrol_showcase","1")</code> puis refresh.</div>
        </div>
      </div>
    </div>
  `;

  return wrap;
}

function refreshSnapshot(doc: Document, root: HTMLElement): void {
  const cs = doc.defaultView?.getComputedStyle(doc.documentElement);
  if (!cs) return;

  root.querySelectorAll("[data-var]").forEach((el) => {
    const name = (el as HTMLElement).getAttribute("data-var")!;
    const v = cs.getPropertyValue(name).trim();
    (el as HTMLElement).textContent = v || "—";
  });

  const de = doc.documentElement as any;
  (root.querySelector('[data-meta="themeId"]') as HTMLElement).textContent = de?.dataset?.icThemeId || "—";
  (root.querySelector('[data-meta="themeMode"]') as HTMLElement).textContent = de?.dataset?.icThemeMode || "—";
  (root.querySelector('[data-meta="appKind"]') as HTMLElement).textContent = de?.dataset?.appKind || "—";
}

export function installIControlShowcaseDEVOnly(): void {
  if (!isDev()) return;
  if (!hasBrowser()) return;
  if (!isEnabled()) return;

  const g = getGlobal();
  const d = g.document as Document;

  // SSOT: do not duplicate
  if (d.getElementById("__ICONTROL_SHOWCASE__")) return;

  ensureStyles(d);
  const ui = buildUI(d);
  d.body.appendChild(ui);
  refreshSnapshot(d, ui);

  ui.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    const action = t?.getAttribute("data-action");
    if (!action) return;

    if (action === "close") {
      ui.remove();
      return;
    }
    if (action === "refresh") {
      refreshSnapshot(d, ui);
      return;
    }
  });
}
