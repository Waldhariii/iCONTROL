import { getBrandResolved } from "../../platform-services/branding/brandService";


/* ICONTROL_SHELL_RECOVERY_V1 (enterprise-grade guardrail)
 * Objectif: empêcher un dashboard CP "sans menu" même si un rendu/route écrase le DOM.
 * Stratégie:
 *  - Conserver une référence globale au shell
 *  - Forcer le mount du shell hors login
 *  - Re-mount automatique sur hashchange
 */
type IControlShell = { root: HTMLElement; main: HTMLElement; setBrandTitle?: (t: string) => void };

function __icontrol_isCpLoginHash__(hash: string): boolean {
  const h = String(hash || "");
  // STRICT login-only (évite faux positifs)
  return h === "#/login" || h.startsWith("#/login?") || h.startsWith("#/login&") || h.startsWith("#/login/");
}

function __icontrol_getAppRoot__(): HTMLElement {
  const el = document.getElementById("app") || document.body;
  return el as HTMLElement;
}

function __icontrol_getShellGlobal__(): IControlShell | null {
  try {
    const w = globalThis as any;
    return (w.__ICONTROL_SHELL__ as IControlShell) || null;
  } catch {
    return null;
  }
}

function __icontrol_setShellGlobal__(shell: IControlShell): void {
  try {
    const w = globalThis as any;
    w.__ICONTROL_SHELL__ = shell;
  } catch {}
}

function __icontrol_setMount__(el: HTMLElement): void {
  try {
    const w = globalThis as any;
    w.__ICONTROL_MOUNT__ = el;
  } catch {}
}

function __icontrol_isShellMounted__(): boolean {
  try {
    const root = __icontrol_getAppRoot__();
    if ((root as any)?.dataset?.uiShell === "UI_SHELL_NAV_V1") return true;
    // fallback: présence d'un root shell typique
    if (root.querySelector("[data-icontrol-shell-root='1']")) return true;
  } catch {}
  return false;
}

function __icontrol_mountShellIfNeeded__(navProvider: () => any[], shellFactory: (nav: any[]) => any): void {
  try {
    const kind = (typeof __icontrol_resolveAppKind === "function") ? __icontrol_resolveAppKind() : "CP";
    const hash = (() => { try { return window.location.hash || ""; } catch { return ""; } })();

    // Sur login CP: ne pas imposer le shell (UX)
    if (kind === "CP" && __icontrol_isCpLoginHash__(hash)) return;

    // Hors login: shell obligatoire
    if (__icontrol_isShellMounted__()) return;

    const appRoot = __icontrol_getAppRoot__();
    const nav = navProvider() || [];
    const shell = shellFactory(nav) as IControlShell;

    // tag DOM
    try { (shell.root as any).dataset.icontrolShellRoot = "1"; } catch {}

    // mount
    appRoot.innerHTML = "";
    appRoot.appendChild(shell.root);

    // mount target pour router
    __icontrol_setMount__(shell.main);
    __icontrol_setShellGlobal__(shell);
  } catch (e) {
    // fail-open: ne pas casser le boot, mais on log
    try { console.warn("ICONTROL_SHELL_RECOVERY_V1 failed", e); } catch {}
  }
}

(function __icontrolNormalizeAppKind__(raw?: string): "CP" | "APP" {
  const k = String(raw || "").trim().toUpperCase();
  // Accept aliases to avoid silent regressions
  if (k === "CP" || k === "CONTROL_PLANE" || k === "CONTROLPLANE" || k === "ADMIN" || k === "ADMINISTRATION") return "CP";
  if (k === "APP" || k === "CLIENT" || k === "DESKTOP_CLIENT") return "APP";
  return "CP"; // fail-open (menu must exist)
});

import {
  createShell,
  getDefaultNavItems,
} from "../../platform-services/ui-shell/layout/shell";
// getDefaultNavItems() route automatiquement vers getDefaultNavItemsApp() ou getDefaultNavItemsCp() selon VITE_APP_KIND
import { applyThemeTokensToCSSVars } from "../../modules/core-system/ui/frontend-ts/pages/_shared/themeCssVars";
import { registerRuntimeConfigEndpoint } from "./core/runtime/runtimeConfigEndpoint";
import { getGlobalWindow, getImportMeta } from "./core/utils/types";
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

/* ICONTROL_THEME_BOOTSTRAP_V1 */
import { applyThemeTokensToCssVars } from "./core/theme/applyThemeCssVars";
import { loadThemePreset } from "./core/theme/loadPreset";
/* END ICONTROL_THEME_BOOTSTRAP_V1 */
import { renderRoute } from "./moduleLoader";
import { getLogger } from "./core/utils/logger";

const logger = getLogger("MAIN");



/* ICONTROL_THEME_BOOTSTRAP_V1 */
async function __ICONTROL_APPLY_THEME_SSOT__(): Promise<void> {
  try {
    // Resolver minimal (enterprise-ready):
    // - Default = cp-dashboard-charcoal (CP) / app-foundation-slate (APP)
    // - Preview via query: ?theme=<id>[.dark|.light]
    const q = new URLSearchParams(window.location.search);
    const kind = __icontrol_resolveAppKind();
    const defaultPreset = kind === "APP" ? "app-foundation-slate" : "cp-dashboard-charcoal";
    const rawPreset = (q.get("theme") || defaultPreset).trim();
    const modeParam = (q.get("mode") || "").trim().toLowerCase();

    let presetId = rawPreset;
    let presetMode = "dark";
    if (rawPreset.endsWith(".light")) {
      presetId = rawPreset.replace(/\.light$/, "");
      presetMode = "light";
    } else if (rawPreset.endsWith(".dark")) {
      presetId = rawPreset.replace(/\.dark$/, "");
      presetMode = "dark";
    } else if (modeParam === "light" || modeParam === "dark") {
      presetMode = modeParam;
    }

    const presetPath = `/src/core/theme/presets/${presetId}.${presetMode}.json`;

    const tokens = await loadThemePreset(presetPath);
    applyThemeTokensToCssVars(document, tokens);

    // Ops proof
    (window as any).__ICONTROL_THEME_ACTIVE__ = { presetId, presetMode, meta: (tokens as any).meta };
    console.info("THEME_SSOT_APPLIED", presetId, presetMode, (tokens as any).meta);
  } catch (e) {
    console.warn("WARN_THEME_SSOT_APPLY_FAILED", String(e));
  }
}
/* END ICONTROL_THEME_BOOTSTRAP_V1 */
/* ICONTROL_APP_CP_GUARD_V1 */
function __icontrol_resolveAppKind(): "APP" | "CP" {
  // Canonical AppKind: "CP" | "APP"
  // Accept legacy aliases to avoid silent nav breakage.
  let raw = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyImportMeta = (import.meta as any);
    raw = String(anyImportMeta?.env?.VITE_APP_KIND || "");
  } catch {}
  try {
    if (!raw) raw = String((globalThis as any)?.__ICONTROL_APP_KIND__ || "");
  } catch {}
  return __icontrolNormalizeAppKind__(raw);

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

/* ADMIN_STYLE_GUARD_V1 (CP only)
 * Objectif: bloquer l’injection de styles non gouvernés (style/link) sur la surface Admin.
 * Guard fail-closed pour les noeuds non autorisés, fail-open sur le rendu global.
 */
function __icontrol_installAdminStyleGuard__(): void {
  try {
    const kind = __icontrol_resolveAppKind();
    if (kind !== "CP") return;

    const w = globalThis as any;
    w.__ICONTROL_APP_KIND__ = kind;
    console.info("ADMIN_STYLE_GUARD_INIT", { kind });
    if (w.__ICONTROL_ADMIN_STYLE_GUARD__) return;
    w.__ICONTROL_ADMIN_STYLE_GUARD__ = {
      enabled: true,
      disableLocalOverrides: true,
      events: [] as Array<{ type: string; detail: string }>
    };
    console.info("ADMIN_STYLE_GUARD_INIT", { kind });

    const allowStyle = (el: HTMLStyleElement): boolean => {
      if ((el as any).dataset?.icontrolAllow === "1") return true;
      if ((el as any).dataset?.viteDevId) return true;
      const id = (el.getAttribute("id") || "").toLowerCase();
      if (id.includes("vite")) return true;
      return false;
    };

    const allowLink = (el: HTMLLinkElement): boolean => {
      if ((el as any).dataset?.icontrolAllow === "1") return true;
      const href = String(el.getAttribute("href") || "");
      if (!href) return false;
      if (href.includes("/_ARCHIVES/") || href.includes("/_BACKUPS") || href.includes("/backups/") || href.includes("/dist/")) return false;
      if (href.includes("/@vite/") || href.includes("/src/") || href.includes("/assets/") || href.includes("/cp/")) return true;
      if (href.endsWith(".css")) return true;
      return false;
    };

    const handleNode = (node: Node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.tagName === "STYLE") {
        const ok = allowStyle(node as HTMLStyleElement);
        if (!ok) {
          try { node.remove(); } catch {}
          w.__ICONTROL_ADMIN_STYLE_GUARD__.events.push({ type: "STYLE_BLOCKED", detail: node.outerHTML.slice(0, 200) });
          console.warn("ADMIN_STYLE_GUARD_BLOCK", { type: "style" });
        }
      }
      if (node.tagName === "LINK") {
        const link = node as HTMLLinkElement;
        if ((link.getAttribute("rel") || "").toLowerCase() === "stylesheet") {
          const ok = allowLink(link);
          if (!ok) {
            try { link.remove(); } catch {}
            w.__ICONTROL_ADMIN_STYLE_GUARD__.events.push({ type: "LINK_BLOCKED", detail: link.outerHTML.slice(0, 200) });
            console.warn("ADMIN_STYLE_GUARD_BLOCK", { type: "link", href: link.href });
          }
        }
      }
    };

    // Initial sweep
    try {
      const head = document.head;
      if (head) {
        Array.from(head.children).forEach((el) => handleNode(el));
      }
    } catch {}

    // Observe head for new style/link nodes
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        Array.from(m.addedNodes || []).forEach((n) => handleNode(n));
      }
    });
    observer.observe(document.head, { childList: true });
    w.__ICONTROL_ADMIN_STYLE_GUARD__.observer = observer;

    // Periodic sweep (belt-and-suspenders)
    const sweep = () => {
      try {
        const head = document.head;
        if (head) Array.from(head.children).forEach((el) => handleNode(el));
      } catch {}
    };
    w.__ICONTROL_ADMIN_STYLE_GUARD__.sweep = sweep;
    setInterval(sweep, 2000);
  } catch (e) {
    console.warn("ADMIN_STYLE_GUARD_FAILED", String(e));
  }
}

__icontrol_installAdminStyleGuard__();

/* CLIENT_STYLE_GUARD_V1 (APP only)
 * Objectif: bloquer l’injection de styles non gouvernés sur la surface Client.
 */
function __icontrol_installClientStyleGuard__(): void {
  try {
    const kind = __icontrol_resolveAppKind();
    if (kind !== "APP") return;

    const w = globalThis as any;
    const allowHref = (href?: string | null): boolean => {
      if (!href) return false;
      if (href.startsWith("http://127.0.0.1") || href.startsWith("http://localhost")) return true;
      if (href.includes("/@vite/") || href.includes("/@fs/")) return true;
      if (href.includes("/src/") || href.includes("/assets/")) return true;
      if (href.includes("/app/")) return true;
      return false;
    };

    const allowStyleTag = (node: HTMLStyleElement): boolean => {
      if (node.hasAttribute("data-vite-dev-id")) return true;
      if (node.hasAttribute("data-ic-allow")) return true;
      return false;
    };

    const blockNode = (node: Element, reason: string): void => {
      try {
        node.parentNode?.removeChild(node);
        console.warn("CLIENT_STYLE_GUARD_BLOCK", { reason });
      } catch {}
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.tagName === "LINK") {
            const link = n as HTMLLinkElement;
            if (link.rel === "stylesheet" && !allowHref(link.href)) {
              blockNode(link, link.href || "stylesheet");
            }
          } else if (n.tagName === "STYLE") {
            const style = n as HTMLStyleElement;
            if (!allowStyleTag(style)) {
              blockNode(style, "inline-style");
            }
          }
        });
      }
    });

    observer.observe(document.head, { childList: true });

    w.__ICONTROL_CLIENT_STYLE_GUARD__ = {
      active: true,
      disableLocalOverrides: true,
      allowHref,
      allowStyleTag,
    };
    console.info("CLIENT_STYLE_GUARD_INIT", { kind });
  } catch {}
}

__icontrol_installClientStyleGuard__();

/* ===== UI_SHELL_NAV_V1 MOUNT =====
   Goal: Provide a stable header + drawer menu independent from modules.
   The router should render into #cxMain (shell main).
*/
(function() {
  try {
    const appRoot = document.getElementById("app") || document.body;

    // Apply theme tokens early
    applyThemeTokensToCSSVars(document);

    // Runtime config shim (si activé)
    try {
      const w = getGlobalWindow() as typeof window & { __ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__?: boolean };
      if (!w.__ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__) {
        w.__ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__ = true;
        const importMeta = getImportMeta();
        if (importMeta.env?.VITE_RUNTIME_CONFIG_SHIM === "1") {
          registerRuntimeConfigEndpoint();
        }
      }
    } catch {}

    // Idempotence marker - NE PAS retourner si déjà monté, on doit vérifier le shell
    try {
      if (appRoot instanceof HTMLElement && appRoot.dataset) {
        // Vérifier si le shell est déjà monté (présence de #cxMain)
        const existingShell = appRoot.querySelector("#cxMain");
        if (existingShell && appRoot.dataset.uiShell === "UI_SHELL_NAV_V1") {
          // Shell déjà monté, juste mettre à jour __ICONTROL_MOUNT__
          const w = getGlobalWindow() as typeof window & { __ICONTROL_MOUNT__?: HTMLElement };
          w.__ICONTROL_MOUNT__ = existingShell as HTMLElement;
          return;
        }
        appRoot.dataset.uiShell = "UI_SHELL_NAV_V1";
      }
    } catch {}

    /* __ICONTROL_BYPASS_SHELL_ON_CP_LOGIN__ */
const __icontrol_hash = (() => { try { return window.location.hash || ""; } catch { return ""; } })();
const __icontrol_kind = __icontrol_resolveAppKind();

/**
 * STRICT LOGIN MATCH:
 * - Autorise UNIQUEMENT "#/login" ou "#/login?..."
 * - Évite tout match permissif qui casserait dashboard/pages.
 */
const __icontrol_isLogin =
  __icontrol_hash === "#/login" ||
  __icontrol_hash.startsWith("#/login?");

/**
 * Gouvernance d'UI Shell (Enterprise guardrail):
 * - CP + login => bypass shell (login minimal)
 * - sinon => shell obligatoire (menu/burger/nav)
 */
if (__icontrol_kind === "CP" && __icontrol_isLogin) {
  appRoot.innerHTML = "";
  const w = getGlobalWindow() as typeof window & { __ICONTROL_MOUNT__?: HTMLElement };
  w.__ICONTROL_MOUNT__ = appRoot;
} else {
  const shell = createShell(getDefaultNavItems());
      /* ICONTROL_SHELL_GLOBAL_V1 */
      try {
        (shell.root as any).dataset.icontrolShellRoot = "1";
      } catch {}
      try {
        __icontrol_setShellGlobal__(shell as any);
      } catch {}

  appRoot.innerHTML = "";
  appRoot.appendChild(shell.root);

  const w = getGlobalWindow() as typeof window & { __ICONTROL_MOUNT__?: HTMLElement };
  w.__ICONTROL_MOUNT__ = shell.main;

      /* ICONTROL_SHELL_REMOUNT_CALL_V1 */
      try {
        __icontrol_mountShellIfNeeded__(
          () => getDefaultNavItems(),
          (nav) => createShell(nav)
        );
      } catch {}

  // Debug: vérifier que le shell est bien monté
  try {
    const debugShell = appRoot.querySelector("#cxMain");
    const debugBurger = appRoot.querySelector("#cxBurger");
    const debugDrawer = appRoot.querySelector("#cxDrawer");
    if (!debugShell) {
      console.error("❌ ERREUR: Shell non monté - #cxMain introuvable dans appRoot");
    } else {
      console.log("✅ Shell monté correctement - #cxMain trouvé");
      if (!debugBurger) {
        console.warn("⚠️ Burger menu introuvable - #cxBurger manquant");
      } else {
        console.log("✅ Burger menu trouvé - #cxBurger présent");
      }
      if (!debugDrawer) {
        console.warn("⚠️ Drawer menu introuvable - #cxDrawer manquant");
      } else {
        console.log("✅ Drawer menu trouvé - #cxDrawer présent");
      }
    }
    // Exposer une fonction de diagnostic globale
    (window as any).__ICONTROL_DIAGNOSTIC__ = () => {
      const root = document.querySelector("[data-icontrol-shell-root='1']");
      const main = document.querySelector("#cxMain");
      const burger = document.querySelector("#cxBurger");
      const drawer = document.querySelector("#cxDrawer");
      const mount = (window as any).__ICONTROL_MOUNT__;
      const appKind = (() => {
        try {
          const meta = import.meta as any;
          return meta.env?.VITE_APP_KIND || "NON_DEFINI";
        } catch {
          return "ERREUR";
        }
      })();
      return {
        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
        burger: burger ? "✅ Trouvé" : "❌ Manquant",
        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
        mount: mount ? "✅ Défini" : "❌ Non défini",
        appKind,
        hash: window.location.hash
      };
    };
    console.log("💡 Pour diagnostiquer, tapez dans la console: __ICONTROL_DIAGNOSTIC__()");
  } catch {}

}
/* END __ICONTROL_BYPASS_SHELL_ON_CP_LOGIN__ */
    try {
      if (__icontrol_kind === "CP" && !__icontrol_isLogin) {
        const b = __br.brand;
        if (b && b.APP_DISPLAY_NAME && shell) shell.setBrandTitle(b.APP_DISPLAY_NAME);
      }
    } catch {}
  } catch (e) {
    console.error("UI_SHELL_NAV_V1 mount failed", e);
  }
})();
  /* ICONTROL_SHELL_HASHCHANGE_V1 */
  try {
    window.addEventListener("hashchange", () => {
      try {
        __icontrol_mountShellIfNeeded__(
          () => getDefaultNavItems(),
          (nav) => createShell(nav)
        );
      } catch {}
    });
  } catch {}
function renderShell(rid: RouteId): void {
  const mount = getMountEl();
  
  // Protection: vérifier que le shell est monté avant de rendre la page
  try {
    const shellRoot = document.querySelector("[data-icontrol-shell-root='1']");
    const shellMain = document.querySelector("#cxMain");
    
    // Si on est sur une page CP (pas login) et que le shell n'est pas monté, le monter
    if (rid !== "login" && !shellRoot && mount === document.getElementById("app")) {
      console.warn("⚠️ Shell non monté, tentative de remontage...");
      const appRoot = document.getElementById("app") || document.body;
      const __icontrol_kind = __icontrol_resolveAppKind();
      const hash = window.location.hash || "";
      const __icontrol_isLogin = hash === "#/login" || hash.startsWith("#/login?");
      
      if (__icontrol_kind === "CP" && !__icontrol_isLogin) {
        const shell = createShell(getDefaultNavItems());
        (shell.root as any).dataset.icontrolShellRoot = "1";
        __icontrol_setShellGlobal__(shell as any);
        appRoot.innerHTML = "";
        appRoot.appendChild(shell.root);
        const w = getGlobalWindow() as typeof window & { __ICONTROL_MOUNT__?: HTMLElement };
        w.__ICONTROL_MOUNT__ = shell.main;
        console.log("✅ Shell remonté avec succès");
      }
    }
  } catch (e) {
    console.warn("⚠️ Erreur lors de la vérification du shell:", e);
  }
  
  renderRoute(rid, mount);
}

// UI_SHELL_NAV_V1_BOOT: ensure shell mount is completed before first route render
queueMicrotask(async () => {

  /* THEME_SSOT_APPLY_CALL_V1 */
  await __ICONTROL_APPLY_THEME_SSOT__();
  /* END THEME_SSOT_APPLY_CALL_V1 */
  // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
  try {
    const { applyVersionGate } = await import("./core/runtime/versionGate");
    const mount = getMountEl();
    const gateResult = await applyVersionGate(mount);
    if (!gateResult.allowed) {
      // VersionGate a bloqué : écran "Update Required" affiché, ne pas continuer
      logger.warn("VERSION_GATE_BLOCKED", "Application blocked by version gate");
      return;
    }
  } catch (e) {
    logger.warn("VERSION_GATE_CHECK_FAILED", String(e));
    // Continuer même si VersionGate échoue (fail open)
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
    logger.warn("WARN_RUNTIME_SMOKE_TOGGLE", String(e));
  }

  bootRouter((rid) => renderShell(rid));
});
       
       // TEST: Verify master user is available
       setTimeout(() => {
         try {
           console.log("🔵 [BOOT TEST] Starting authentication test...");
           import("./localAuth").then(({ authenticate }) => {
             console.log("🔵 [BOOT TEST] authenticate function imported");
             const testResult = authenticate("master", "1234", "CP");
             console.log("🔵 [BOOT TEST] Test result:", testResult);
             if (testResult.ok) {
               console.log("✅ [BOOT TEST] Master user authentication works!");
               console.log("✅ [BOOT TEST] Session:", testResult.session);
             } else {
               console.error("❌ [BOOT TEST] Master user authentication FAILED:", testResult.error);
               console.error("❌ [BOOT TEST] Full result:", JSON.stringify(testResult, null, 2));
             }
           }).catch((e) => {
             console.error("❌ [BOOT TEST] Failed to import authenticate:", e);
           });
         } catch (e) {
           console.error("❌ [BOOT TEST] Failed to test authentication:", e);
         }
       }, 1000);
