import { getBrandResolved } from "../../platform-services/branding/brandService";
import {
  createShell,
  getDefaultNavItems,
} from "../../platform-services/ui-shell/layout/shell";
import { applyThemeTokensToCSSVars } from "../../modules/core-system/ui/frontend-ts/pages/_shared/themeCssVars";
import { registerRuntimeConfigEndpoint } from "./core/runtime/runtimeConfigEndpoint";
/* UI_SHELL_NAV_V1 */
// ICONTROL_BRAND_TITLE_V1
const __br = getBrandResolved();
try {
  const b = __br.brand;
  const suffix =
    b.TITLE_SUFFIX && b.TITLE_SUFFIX.trim() ? " " + b.TITLE_SUFFIX.trim() : "";
  document.title = (b.APP_DISPLAY_NAME || "iCONTROL") + suffix;
  if (__br.warnings && __br.warnings.length) {
    console.warn("WARN_BRAND_FALLBACK", __br.warnings);
  }
} catch (e) {
  console.warn("WARN_BRAND_TITLE_FAILED", String(e));
}
// END ICONTROL_BRAND_TITLE_V1

import { bootRouter, RouteId, getMountEl } from "./router";
import { renderRoute } from "./moduleLoader";

/* ICONTROL_APP_CP_GUARD_V1 */
function __icontrol_resolveAppKind(): "APP" | "CP" {
  // 1) .env build-time (si existant)
  const k = (import.meta as any)?.env?.VITE_APP_KIND;
  if (k === "CLIENT_APP" || k === "APP") return "APP";
  if (k === "CONTROL_PLANE" || k === "CP") return "CP";

  // 2) runtime heuristic (path first)
  try {
    const p = window.location.pathname || "/";
    if (p.startsWith("/cp")) return "CP";
    if (p.startsWith("/app")) return "APP";
  } catch {}

  // 3) fallback safe: APP (client) par défaut
  return "APP";
}

function __icontrol_guardAppVsCp(): void {
  try {
    const kind = __icontrol_resolveAppKind();
    const path = window.location.pathname || "/";
    const hash = window.location.hash || "";

    const wantsCp =
      path.startsWith("/cp") ||
      hash.startsWith("#/cp") ||
      hash.startsWith("#/console") ||
      hash.startsWith("#/management");

    const wantsApp = path.startsWith("/app") || hash.startsWith("#/app");

    // APP: interdit CP
    if (kind === "APP" && wantsCp) {
      // redirect vers /app/#/login si possible, sinon /#/login
      const target = path.startsWith("/app") ? "/app/#/login" : "/#/login";
      window.location.replace(target);
      return;
    }

    // CP: interdit APP
    if (kind === "CP" && wantsApp) {
      const target = path.startsWith("/cp") ? "/cp/#/login" : "/#/login";
      window.location.replace(target);
      return;
    }
  } catch {
    // fail closed? Non: fail-safe (ne pas casser le boot).
    // Le contrôle dur est assuré côté AuthZ/RBAC serveur quand il existera.
  }
}

__icontrol_guardAppVsCp();

/* ===== UI_SHELL_NAV_V1 MOUNT =====
   Goal: Provide a stable header + drawer menu independent from modules.
   The router should render into #cxMain (shell main).
*/
(function () {
  try {
    const appRoot = document.getElementById("app") || document.body;
    // ICONTROL_THEME_CSSVARS_BOOTSTRAP_V1
    // ICONTROL_THEME_CSSVARS_V1: apply tokens before any page render
    applyThemeTokensToCSSVars(document);
    // ICONTROL_RUNTIME_CONFIG_SHIM_BOOT_GUARD_V1
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!w.__ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__) {
        w.__ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__ = true;
        if ((import.meta as any)?.env?.VITE_RUNTIME_CONFIG_SHIM === "1") {
          registerRuntimeConfigEndpoint();
        }
      }
    } catch {
      // ignore
    }
    // UI_SHELL_NAV_V1_GUARD: prevent double-mount and expose verifiable marker
    try {
      if (
        (appRoot as any).dataset &&
        (appRoot as any).dataset.uiShell === "UI_SHELL_NAV_V1"
      ) {
        return;
      } else {
        (appRoot as any).dataset.uiShell = "UI_SHELL_NAV_V1";
      }
    } catch (_) {}

    const shell = createShell(getDefaultNavItems());
    appRoot.innerHTML = "";
    appRoot.appendChild(shell.root);

    // expose mount target for router/pages
    (window as any).__ICONTROL_MOUNT__ = shell.main;

    try {
      const b = __br.brand;
      if (b && b.APP_DISPLAY_NAME) shell.setBrandTitle(b.APP_DISPLAY_NAME);
    } catch (_) {}
  } catch (e) {
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
