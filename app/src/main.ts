import { getBrandResolved } from "../../platform-services/branding/brandService";
import { createShell, getDefaultNavItems } from "../../platform-services/ui-shell/layout/shell";
import { applyThemeTokensToCSSVars } from "../../modules/core-system/ui/frontend-ts/pages/_shared/themeCssVars";
/* UI_SHELL_NAV_V1 */
// ICONTROL_BRAND_TITLE_V1
const __br = getBrandResolved();
try{
  const b = __br.brand;
  const suffix = (b.TITLE_SUFFIX && b.TITLE_SUFFIX.trim()) ? " " + b.TITLE_SUFFIX.trim() : "";
  document.title = (b.APP_DISPLAY_NAME || "iCONTROL") + suffix;
  if(__br.warnings && __br.warnings.length){ console.warn("WARN_BRAND_FALLBACK", __br.warnings); }
}catch(e){ console.warn("WARN_BRAND_TITLE_FAILED", String(e)); }
// END ICONTROL_BRAND_TITLE_V1

import { bootRouter, RouteId, getMountEl } from "./router";
import { renderRoute } from "./moduleLoader";

/* ===== UI_SHELL_NAV_V1 MOUNT =====
   Goal: Provide a stable header + drawer menu independent from modules.
   The router should render into #cxMain (shell main).
*/
(function(){
  try{
    const appRoot = document.getElementById("app") || document.body;
    // ICONTROL_THEME_CSSVARS_BOOTSTRAP_V1
    // ICONTROL_THEME_CSSVARS_V1: apply tokens before any page render
    applyThemeTokensToCSSVars(document);
    // UI_SHELL_NAV_V1_GUARD: prevent double-mount and expose verifiable marker
    try{
      if((appRoot as any).dataset && (appRoot as any).dataset.uiShell === "UI_SHELL_NAV_V1"){
        return;
      }else{
        (appRoot as any).dataset.uiShell = "UI_SHELL_NAV_V1";
      }
    }catch(_){ }

    const shell = createShell(getDefaultNavItems());
    appRoot.innerHTML = "";
    appRoot.appendChild(shell.root);

    // expose mount target for router/pages
    (window as any).__ICONTROL_MOUNT__ = shell.main;

    try{
      const b = __br.brand;
      if (b && b.APP_DISPLAY_NAME) shell.setBrandTitle(b.APP_DISPLAY_NAME);
    }catch(_){ }
  }catch(e){
    console.error("UI_SHELL_NAV_V1 mount failed", e);
  }
})();

function renderShell(rid: RouteId): void {
  const mount = getMountEl();
  renderRoute(rid, mount);
}

// UI_SHELL_NAV_V1_BOOT: ensure shell mount is completed before first route render
queueMicrotask(() => {
  /* RUNTIME_SMOKE_TOGGLE_V1 */
  try {
    const __q = new URLSearchParams(window.location.search);
    if (__q.get("runtime") === "1") {
      const mount = getMountEl();
      import("./pages/runtime-smoke").then((m) => m.renderRuntimeSmoke(mount));
      return;
    }
  } catch (e) {
    console.warn("WARN_RUNTIME_SMOKE_TOGGLE", String(e));
  }

  bootRouter((rid) => renderShell(rid));
});
