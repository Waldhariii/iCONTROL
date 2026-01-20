import { getBrandResolved } from "../../platform-services/branding/brandService";
import { loadRuntimeConfig, applyRuntimeConfigToWindow } from "./core/runtime/runtimeConfig/loader";
import { createShell, getDefaultNavItems } from "../../platform-services/ui-shell/layout/shell";
import { getCurrentHash } from "/src/runtime/navigate";
import { createCPToolboxShell, CPNavTab, CPSidebarSection } from "./core/layout/cpToolboxShell";
import { getAppKind } from "./pages/appContext";
import { isLoggedIn, getSession } from "./localAuth";
import { canAccessPageRoute, getRole } from "./runtime/rbac";
import { getSafeMode } from "../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
// ICONTROL_SHELL_CSS_IMPORT_V1: Import explicit du CSS du shell pour s'assurer qu'il est chargé
import "../../platform-services/ui-shell/layout/shell.css";
// ICONTROL_CP_TOOLBOX_SHELL_CSS_V1: Import du CSS du nouveau shell Toolbox pour CP
import "./core/layout/cpToolboxShell.css";
// ICONTROL_RESPONSIVE_CSS_V1: Import du CSS responsive
import "./core/responsive/responsive.css";
import { applyThemeTokensToCSSVars } from "../../modules/core-system/ui/frontend-ts/pages/_shared/themeCssVars";
import { registerRuntimeConfigEndpoint } from "./core/runtime/runtimeConfigEndpoint";
import { debugLog, warnLog, errorLog } from "./core/utils/logger";
import { bootRouter, RouteId, getMountEl } from "./router";
import { renderRoute } from "./moduleLoader";
import { updateAllLogos, setupLogoThemeObserver } from "./core/branding/logoManager";
import { initKeyboardShortcuts } from "./core/ui/keyboardShortcuts";
import { checkVersionGateAPI } from "./core/release/versionGate";
import { showUpdateModal } from "./core/ui/updateModal";
import { themeManager } from "./core/themes/themeManager";
import { systemMetrics } from "./core/monitoring/systemMetrics";
import { initAccessibility } from "./core/ui/accessibility";
import { errorTracker } from "./core/errors/errorTracker";
import { onboardingManager } from "./core/ui/onboarding";
import { gracefulDegradation } from "./core/degradation/gracefulDegradation";
import { performanceBudgetManager } from "./core/performance/performanceBudget";
import { initializeCommandPalette } from "./core/ui/commandPalette";

/* UI_SHELL_NAV_V1 */
// ICONTROL_BRAND_TITLE_V1
const __br = getBrandResolved();
try {
  const b = __br.brand;
  const suffix =
    b.TITLE_SUFFIX && b.TITLE_SUFFIX.trim() ? " " + b.TITLE_SUFFIX.trim() : "";
  document.title = (b.APP_DISPLAY_NAME || "iCONTROL") + suffix;
  if (__br.warnings && __br.warnings.length) {
    warnLog("WARN_BRAND_FALLBACK", __br.warnings);
  }
} catch (e) {
  warnLog("WARN_BRAND_TITLE_FAILED", String(e));
}
// END ICONTROL_BRAND_TITLE_V1

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
    const hash = getCurrentHash() || "";

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
    // ICONTROL_THEME_MANAGER_INIT_V1: Initialiser le gestionnaire de thèmes
    themeManager.initialize();
    // ICONTROL_MONITORING_INIT_V1: Démarrer la collecte de métriques système
    systemMetrics.startCollection(5000);
    // ICONTROL_ACCESSIBILITY_INIT_V1: Initialiser accessibilité WCAG 2.1 AA
    initAccessibility();
    // ICONTROL_ERROR_TRACKER_INIT_V1: Initialiser error tracking avancé
    errorTracker.init();
    // ICONTROL_GRACEFUL_DEGRADATION_INIT_V1: Initialiser graceful degradation
    gracefulDegradation.init();
    // ICONTROL_PERFORMANCE_BUDGET_INIT_V1: Démarrer performance budget monitoring
    setTimeout(() => performanceBudgetManager.collectMetrics(), 3000);
    // ICONTROL_COMMAND_PALETTE_INIT_V1: Initialiser command palette (⌘K / Ctrl+K)
    initializeCommandPalette();
    // ICONTROL_ONBOARDING_INIT_V1: Vérifier si tour d'onboarding nécessaire
    if (!onboardingManager.isTourCompleted("welcome")) {
      setTimeout(() => {
        onboardingManager.startTour("welcome").catch(console.warn);
      }, 2000);
    }
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

    const appKind = getAppKind();
    let shell: any;
    let mountEl: HTMLElement;

    // ICONTROL_CP_TOOLBOX_SHELL_V1: Utiliser le nouveau shell style Developer Toolbox pour CP
    if (appKind === "CP") {
      // Créer les tabs pour la navigation supérieure (aucun tab pour l'instant)
      const tabs: CPNavTab[] = [];

      // Sections de la sidebar simplifiées (le sidebar utilise maintenant un menu simple)
      const sidebarSections: CPSidebarSection[] = [];

      // Créer la zone de contenu
      const contentArea = document.createElement("div");
      contentArea.id = "cxMain";
      contentArea.className = "cxMain";
      contentArea.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 0;
        width: 100%;
        max-width: 100%;
        height: 100%;
        margin: 0;
        background: var(--ic-bg, #0f1112);
        box-sizing: border-box;
      `;

      const toolboxShell = createCPToolboxShell({
        tabs: tabs.filter(t => t.show()),
        sidebarSections,
        contentArea,
      });

      appRoot.innerHTML = "";
      appRoot.appendChild(toolboxShell);

      mountEl = contentArea;
      shell = {
        root: toolboxShell,
        main: contentArea,
        setBrandTitle: (title: string) => {
          const titleEl = toolboxShell.querySelector(".icontrol-cp-brand-title, .icontrol-cp-title");
          if (titleEl) titleEl.textContent = title || "Console";
        },
        closeDrawer: () => {},
        rerenderNav: () => {},
      };
    } else {
      // APP: utiliser l'ancien shell
      shell = createShell(getDefaultNavItems());
      mountEl = shell.main;
      appRoot.innerHTML = "";
      appRoot.appendChild(shell.root);
    }

    debugLog("🟡 Shell créé", { appKind, id: mountEl.id, className: mountEl.className });

    // expose mount target for router/pages
    (window as any).__ICONTROL_MOUNT__ = mountEl;
    debugLog("✅ __ICONTROL_MOUNT__ défini");

    try {
      const b = __br.brand;
      if (b && b.APP_DISPLAY_NAME) shell.setBrandTitle("Console");
    } catch (_) {}
    
    // ICONTROL_LOGO_INIT_V1: Initialiser les logos après le montage du shell
    try {
      updateAllLogos();
      setupLogoThemeObserver();
    } catch (e) {
      warnLog("WARN_LOGO_INIT_FAILED", String(e));
    }
    
    // ICONTROL_KEYBOARD_SHORTCUTS_V1: Initialiser les raccourcis clavier
    try {
      initKeyboardShortcuts();
      debugLog("✅ Raccourcis clavier initialisés");
    } catch (e) {
      warnLog("WARN_KEYBOARD_SHORTCUTS_INIT_FAILED", String(e));
    }
  } catch (e) {
    errorLog("UI_SHELL_NAV_V1 mount failed", e);
  }
})();

function renderShell(rid: RouteId): void {
  const mount = getMountEl();
  debugLog("🟢 renderShell appelé", { route: rid, mountId: mount?.id });
  if (!mount) {
    errorLog("❌ ERREUR: Élément de montage (mount) introuvable");
    return;
  }
  renderRoute(rid, mount);
  debugLog("✅ renderShell terminé", { length: mount.innerHTML?.length || 0 });
}

// UI_SHELL_NAV_V1_BOOT: ensure shell mount is completed before first route render
async function startApp() {
  try {
    // Vérifier que le DOM est prêt
    if (typeof document === "undefined" || !document.getElementById("app")) {
      // Si le DOM n'est pas prêt, attendre
      if (typeof window !== "undefined" && document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startApp);
        return;
      }
      // Fallback: attendre un peu
      setTimeout(startApp, 100);
      return;
    }

    // ICONTROL_VERSION_GATE_V1: Vérifier la version avant de démarrer
    try {
      const versionGate = await checkVersionGateAPI();
      if (versionGate.requiresUpdate) {
        showUpdateModal(versionGate);
        // Ne pas démarrer l'application si mise à jour requise
        return;
      }
    } catch (e) {
      warnLog("WARN_VERSION_GATE_CHECK_FAILED", String(e));
      // Continuer même si la vérification échoue (fail-safe)
    }

          /* RUNTIME_SMOKE_TOGGLE_V1 */
          try {
            const __q = new URLSearchParams(window.location.search);
            if (__q.get("runtime") === "1") {
              const mount = getMountEl();
              import("./pages/runtime-smoke").then((m) => m.renderRuntimeSmoke(mount));
              return;
            }
          } catch (e) {
            warnLog("WARN_RUNTIME_SMOKE_TOGGLE", String(e));
          }

    bootRouter((rid) => renderShell(rid));
    
    // Appliquer les modifications publiées après le chargement de la page
    setTimeout(() => {
      import("./core/pageEditor/pageModificationManager").then(({ applyPublishedModifications }) => {
        applyPublishedModifications();
      }).catch(() => {
        // Ignorer si le module n'est pas disponible
      });
    }, 1000);
  } catch (e) {
    errorLog("❌ ERREUR lors du démarrage de l'application:", e);
    const appRoot = document.getElementById("app");
    if (appRoot) {
      appRoot.innerHTML = `
        <div style="padding:40px;text-align:center;font-family:system-ui;color:var(--ic-text, #e9e9e9);">
          <h2>Erreur de démarrage</h2>
          <p>Une erreur est survenue lors du chargement de l'application.</p>
          <pre style="text-align:left;margin:20px auto;max-width:600px;padding:20px;background:var(--ic-panel, #2b2b2b);border-radius:8px;overflow:auto;">
${String(e)}
${(e as any)?.stack ? "\n\n" + String((e as any).stack) : ""}
          </pre>
          <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;border-radius:8px;background:var(--ic-accent2, #94b83b);color:var(--ic-text, #e9e9e9);border:none;cursor:pointer;font-weight:bold;">
            Recharger la page
          </button>
        </div>
      `;
    }
  }
}

// Démarrer l'application quand le DOM est prêt
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    // DOM déjà chargé, démarrer immédiatement
    queueMicrotask(startApp);
  }
} else {
  // Fallback si document n'est pas disponible
  if (typeof window !== "undefined") {
    window.addEventListener("load", startApp);
  }
}
