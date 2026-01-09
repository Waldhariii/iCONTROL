import { getBrandResolved } from "../../core-kernel/branding/brand";
// ICONTROL_BRAND_TITLE_V1
const __br = getBrandResolved();
try{
  const b = __br.brand;
  const suffix = (b.TITLE_SUFFIX && b.TITLE_SUFFIX.trim()) ? " " + b.TITLE_SUFFIX.trim() : "";
  document.title = (b.APP_DISPLAY_NAME || "iCONTROL") + suffix;
  if(__br.warnings && __br.warnings.length){ console.warn("WARN_BRAND_FALLBACK", __br.warnings); }
}catch(e){ console.warn("WARN_BRAND_TITLE_FAILED", String(e)); }
// END ICONTROL_BRAND_TITLE_V1

import { bootRouter, RouteId, doLogout } from "./router";
import { renderRoute } from "./moduleLoader";

function ensureRoot(): HTMLElement {
  let root = document.getElementById("app");
  if (!root) {
    root = document.createElement("div");
    root.id = "app";
    document.body.appendChild(root);
  }
  return root;
}

function renderShell(rid: RouteId): void {
  const root = ensureRoot();

  // No leader/header on login (per requirement)
  const showHeader = (rid !== "login");

  const header = showHeader
    ? `<div style="position:sticky;top:0;z-index:10;background:rgba(15,17,18,0.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="max-width:980px;margin:0 auto;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:900">iCONTROL</div>
          <button id="logoutBtn" style="border:1px solid rgba(255,255,255,0.15);background:transparent;color:inherit;border-radius:12px;padding:8px 10px;cursor:pointer">Déconnexion</button>
        </div>
      </div>`
    : "";

  root.innerHTML = `
    <div style="min-height:100vh;background:radial-gradient(1200px 800px at 20% 0%, #1a1f23 0%, #0f1112 55%) fixed;color:#e7ecef;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      ${header}
      <div id="page"></div>
    </div>
  `;

  if (showHeader) {
    const btn = root.querySelector<HTMLButtonElement>("#logoutBtn");
    if (btn) btn.onclick = () => doLogout();
  }

  const page = root.querySelector<HTMLElement>("#page")!;
  renderRoute(rid, page);
}

bootRouter((rid) => renderShell(rid));
