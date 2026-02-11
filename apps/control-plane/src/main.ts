import "./styles/tokens.generated.css";
import { info, warn, error } from "./platform/observability/logger";
import { resolveRuntimeContext } from "./platform/runtimeContext";
import { hydrateTenantRuntime } from "./platform/bootstrap";
import { getBrandResolved } from "./platform/branding/brandService";
import { getSession } from "./localAuth";
import { getApiBase } from "./core/runtime/apiBase";
import "./styles/STYLE_ADMIN_FINAL.css";
import { installIControlDiagnosticDEVOnly } from "./dev/diagnostic";
import { bootstrapCpEnforcement } from "./core/ports/cpEnforcement.bootstrap";
import "./styles/icontrol.generated.css";

// Boot marker + minimal crash surface (helps when console is empty)
try {
  (globalThis as any).__ICONTROL_BOOT_OK__ = true;
} catch {}

function __icontrol_setBootStage__(msg: string): void {
  try {
    const el = document.getElementById("icontrol-boot");
    if (el) el.textContent = msg;
  } catch {}
}

function __icontrol_reportBootError__(msg: string): void {
  try {
    const boot = document.getElementById("icontrol-boot");
    if (boot) {
      boot.textContent = `Boot error: ${msg}`;
      return;
    }
    const appRoot = document.getElementById("app");
    if (appRoot) {
      appRoot.innerHTML = `<div class="error-state">Boot error: ${msg}</div>`;
    }
  } catch {}
}

try {
  window.addEventListener("error", (e) => {
    const msg = (e as ErrorEvent).message || "Unknown error";
    __icontrol_reportBootError__(msg);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = (e as PromiseRejectionEvent).reason;
    const msg = reason instanceof Error ? reason.message : String(reason || "Unhandled rejection");
    __icontrol_reportBootError__(msg);
  });
} catch {}

/* ICONTROL_SHELL_RECOVERY_V1 (enterprise-grade guardrail)
 * Objectif: empêcher un dashboard CP "sans menu" même si un rendu/route écrase le DOM.
 * Stratégie:
 *  - Conserver une référence globale au shell
 *  - Forcer le mount du shell hors login
 *  - Re-mount automatique sur hashchange
 */
type IControlShell = { root: HTMLElement; main: HTMLElement; setBrandTitle?: (t: string) => void };

// NOTE: login removed - this function is no longer needed

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
    __icontrol_setMountSSOT__(el);
  } catch {}
}

/* ICONTROL_MOUNT_SSOT_V1 */
function __icontrol_setMountSSOT__(el: HTMLElement): void {
  try {
    const w = getGlobalWindow() as typeof window & { __ICONTROL_MOUNT__?: HTMLElement };
    w.__ICONTROL_MOUNT__ = el;
  } catch {}
}

function __icontrol_resolveMountSSOT__(): HTMLElement {
  // Priority: cxMain (shell) -> global mount -> #app -> body
  const cxMain = document.querySelector("#cxMain") as (HTMLElement | null);
  if (cxMain) {
    // Auto-heal: if global mount is stale or points to app while shell exists, re-point to cxMain
    try { __icontrol_setMountSSOT__(cxMain); } catch {}
    return cxMain;
  }

  const w = getGlobalWindow() as any;
  const mount = (w && w.__ICONTROL_MOUNT__) as (HTMLElement | undefined);

  // Validate: mount must be connected to DOM
  if (mount && (mount as any).isConnected) return mount;

  const app = document.getElementById("app") as (HTMLElement | null);
  if (app) {
    // Auto-heal: ensure global mount is never stale
    try { __icontrol_setMountSSOT__(app); } catch {}
    return app;
  }

  return document.body;
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
    const hash = (() => { try { return window.location.hash || ""; } catch { return ""; } })();

    // Ne pas monter le shell sur la page de login
    if (hash === "#/login" || hash.startsWith("#/login")) {
      return; // Pas de shell pour login
    }

    // Shell always required for CP (sauf login)

    // Hors login: shell obligatoire
    if (__icontrol_isShellMounted__()) return;

    const appRoot = __icontrol_getAppRoot__();
    const nav = navProvider() || [];
    const shell = shellFactory(nav) as IControlShell;

    // tag DOM
    try { (shell.root as any).dataset["icontrolShellRoot"] = "1"; } catch {}

    // mount
    appRoot.innerHTML = "";
    appRoot.appendChild(shell.root);

    // mount target pour router
    __icontrol_setMount__(shell.main);
    __icontrol_setShellGlobal__(shell);
  } catch (e) {
    // fail-open: ne pas casser le boot, mais on log
    try { void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["ICONTROL_SHELL_RECOVERY_V1 failed", e] }); } catch {}
  }
}

function __icontrolNormalizeAppKind__(raw?: string): "CP" | "APP" {
  const k = String(raw || "").trim().toUpperCase();
  // Accept aliases to avoid silent regressions
  if (k === "CP" || k === "CONTROL_PLANE" || k === "CONTROLPLANE" || k === "ADMIN" || k === "ADMINISTRATION") return "CP";
  if (k === "APP" || k === "CLIENT" || k === "DESKTOP_CLIENT" || k === "CLIENT_APP") return "APP";
  return "CP"; // fail-open (menu must exist)
}

import {
  createShell,
  getDefaultNavItems,
} from "./platform/ui-shell/layout/shell";
// getDefaultNavItems() route automatiquement vers getDefaultNavItemsApp() ou getDefaultNavItemsCp() selon VITE_APP_KIND

try { if (String(import.meta?.env?.["VITE_APP_KIND"] || "").toUpperCase() === "CP") bootstrapCpEnforcement(); } catch {}
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
    void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["WARN_BRAND_FALLBACK", __br.warnings] });
  }
} catch (e) {
  void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["WARN_BRAND_TITLE_FAILED", String(e)] });
}
// END ICONTROL_BRAND_TITLE_V1

import { applyClientV2Guards, bootRouter, RouteId, navigate } from "./router";

/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
import { renderRoute } from "./moduleLoader";
import { getLogger } from "./platform/observability/logger";
import { applyStoredThemeMode, installAutoThemeModeListener } from "./platform/theme/themeMode";
import { applyGlobalThemeOverrides, readGlobalThemeOverrides } from "./platform/theme/globalThemeOverrides";
import { loadEntitlements, saveEntitlements } from "./core/entitlements/storage";

const logger = getLogger("MAIN");



/* ICONTROL_THEME_BOOTSTRAP_V1 — single path: generated CSS vars + dataset */
async function __ICONTROL_APPLY_THEME_SSOT__(): Promise<void> {
  try {
    const kind = (typeof __icontrol_resolveAppKind === "function")
      ? __icontrol_resolveAppKind()
      : "CP";
    const root = document.documentElement;
    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
    const themeMode = applyStoredThemeMode(root);
    root.dataset["icThemeId"] = themeId;
    root.dataset["icThemeMode"] = themeMode;
    root.dataset["icThemeScope"] = kind === "CP" ? "cp.dashboard" : "app.foundation";
    if (kind === "CP") {
      root.dataset["appKind"] = "control_plane";
    } else {
      delete root.dataset["appKind"];
    }
    installAutoThemeModeListener(root);
    applyGlobalThemeOverrides(kind === "CP" ? "CP" : "APP", readGlobalThemeOverrides());
  } catch (e) {
    logger.warn("THEME_SSOT_BOOTSTRAP_FAILED", String(e));
  }
}
/* END ICONTROL_THEME_BOOTSTRAP_V1 */

/* ICONTROL_DENSITY_BOOTSTRAP_V1 */
async function __ICONTROL_APPLY_DENSITY__(): Promise<void> {
  try {
    const ctx = resolveRuntimeContext();
    if (ctx.appKind !== "CP") return;
    const root = document.documentElement;
    const s = getSession();
    const user = String((s as any)?.username || (s as any)?.userId || "anonymous");
    const role = String((s as any)?.role || "USER").toUpperCase();
    const storageKey = `icontrol:cp:density:${ctx.tenantId}:${user}`;

    const apply = (mode?: string) => {
      root.classList.remove("ic-density-compact", "ic-density-dense");
      if (mode === "compact") root.classList.add("ic-density-compact");
      if (mode === "dense") root.classList.add("ic-density-dense");
    };

    try {
      const local = localStorage.getItem(storageKey);
      if (local) apply(local);
    } catch {}

    try {
      const API_BASE = getApiBase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/api/cp/prefs/cp_density`, {
        headers: {
          "x-tenant-id": ctx.tenantId,
          "x-user-id": user,
          "x-user-role": role,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data?: { value?: string } | null };
        const mode = json?.data?.value;
        if (mode) {
          apply(mode);
          try {
            localStorage.setItem(storageKey, mode);
          } catch {}
        }
      }
    } catch {}
  } catch (e) {
    logger.warn("DENSITY_BOOTSTRAP_FAILED", String(e));
  }
}
/* END ICONTROL_DENSITY_BOOTSTRAP_V1 */
/* ICONTROL_APP_CP_GUARD_V1 */
function __icontrol_assertAppKind__(): void {
  const allowed = new Set(["APP", "CLIENT_APP", "CONTROL_PLANE", "CP"]);
  let raw = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyImportMeta = (import.meta as any);
    raw = String(anyImportMeta?.env?.["VITE_APP_KIND"] || "");
  } catch {}
  try {
    if (!raw) raw = String((globalThis as any)?.__ICONTROL_APP_KIND__ || "");
  } catch {}
  
  // Fallback: détecter depuis le pathname (pour servir les deux apps depuis le même serveur)
  if (!raw && typeof window !== "undefined") {
    try {
      const pathname = window.location.pathname || "";
      if (pathname.startsWith("/app")) {
        raw = "APP";
      } else if (pathname.startsWith("/cp")) {
        raw = "CONTROL_PLANE";
      }
    } catch {}
  }
  
  const normalized = raw.trim().toUpperCase();
  if (!normalized || !allowed.has(normalized)) {
    throw new Error(
      `ICONTROL_BOOT_GUARD: VITE_APP_KIND invalide ou absent (valeur: \"${raw}\").`,
    );
  }
}

function __icontrol_resolveAppKind(): "APP" | "CP" {
  // Canonical AppKind: "CP" | "APP"
  // Accept legacy aliases to avoid silent nav breakage.
  let raw = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyImportMeta = (import.meta as any);
    raw = String(anyImportMeta?.env?.["VITE_APP_KIND"] || "");
  } catch {}
  try {
    if (!raw) raw = String((globalThis as any)?.__ICONTROL_APP_KIND__ || "");
  } catch {}
  
  // Fallback: détecter depuis le pathname (pour servir les deux apps depuis le même serveur)
  if (!raw && typeof window !== "undefined") {
    try {
      const pathname = window.location.pathname || "";
      if (pathname.startsWith("/app")) return "APP";
      if (pathname.startsWith("/cp")) return "CP";
    } catch {}
  }
  
  return __icontrolNormalizeAppKind__(raw);
}

function __icontrol_redirect__(target: string): void {
  // Prevent full-page redirect loops when the target is already active.
  try {
    const lastRedirect = (globalThis as any).__ICONTROL_LAST_REDIRECT__;
    const now = Date.now();
    
    // Anti-boucle: si on a déjà redirigé vers cette cible récemment, ne pas rediriger
    if (lastRedirect && lastRedirect.target === target && (now - lastRedirect.ts) < 2000) {
      return; // Éviter la boucle
    }
    
    (globalThis as any).__ICONTROL_LAST_REDIRECT__ = target;
    (globalThis as any).__ICONTROL_LAST_REDIRECT_TS__ = now;
  } catch {}
  try {
    const origin = window.location.origin;
    const absTarget = target.startsWith("http") ? target : `${origin}${target}`;
    const here = window.location.href;
    if (here === absTarget) return;
    // Also guard against same-path same-hash redirects.
    const next = new URL(absTarget);
    if (
      next.pathname === window.location.pathname &&
      next.hash === window.location.hash
    ) {
      return;
    }
    window.location.replace(target);
  } catch {}
}

function __icontrol_guardAppVsCp(): void {
  try {
    // Anti-boucle: ne pas exécuter si déjà exécuté récemment
    const lastGuard = (globalThis as any).__ICONTROL_GUARD_APP_CP_LAST__;
    const now = Date.now();
    if (lastGuard && (now - lastGuard.ts) < 1000) {
      return; // Éviter les exécutions multiples rapides
    }
    (globalThis as any).__ICONTROL_GUARD_APP_CP_LAST__ = { ts: now };
    
    const kind = __icontrol_resolveAppKind();
    const path = String(window.location.pathname || "/");
    const hash = String(window.location.hash || "");
    const hashPath = hash.startsWith("#") ? hash.slice(1) : hash;
    const pathIsApp = path.startsWith("/app");
    const pathIsCp = path.startsWith("/cp");
    const hashWantsCp =
      hashPath.startsWith("/cp") ||
      hashPath.startsWith("/console") ||
      hashPath.startsWith("/management");
    const hashWantsApp = hashPath.startsWith("/app");

    // Vérifier si on est déjà sur la bonne route pour éviter les redirections inutiles
    if (pathIsApp && kind === "APP" && (hash === "" || hash === "#/home-app" || hash.startsWith("#/home-app"))) {
      return; // Déjà sur la bonne route APP
    }
    if (pathIsCp && kind === "CP" && (hash === ""  )) {
      return; // Déjà sur la bonne route CP
    }

    if (pathIsApp && hashWantsCp) {
      __icontrol_redirect__("/app/#/dashboard");
      return;
    }
    if (pathIsCp && hashWantsApp) {
      __icontrol_redirect__("/cp/#/dashboard");
      return;
    }

    const wantsCp = pathIsCp || hashWantsCp;
    const wantsApp = pathIsApp || hashWantsApp;

    // APP: interdit CP
    if (kind === "APP" && wantsCp) {
      // redirect vers /app/#/home-app (route APP valide)
      const target = "/app/#/dashboard";
      __icontrol_redirect__(target);
      return;
    }

    // CP: interdit APP
    if (kind === "CP" && wantsApp) {
      const target = "/cp/#/dashboard";
      __icontrol_redirect__(target);
      return;
    }
  } catch {
    // fail closed? Non: fail-safe (ne pas casser le boot).
    // Le contrôle dur est assuré côté AuthZ/RBAC serveur quand il existera.
  }
}

/**
 * ICONTROL_BOOT_ORDER_V1 (enterprise-grade)
 * 1. __icontrol_guardAppVsCp: path/hash vs APP/CP → location.replace si incohérent.
 * 2. applyClientV2Guards: APP uniquement, routes Client V2 → coreNavigate si interdit.
 * 3. IIFE UI_SHELL_NAV: mount shell (ou #app pour CP+login) — critical CSS + placeholder déjà dans index.html.
 * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
 */
__icontrol_guardAppVsCp();
applyClientV2Guards();

const __icontrolIsLocalDev__ = (): boolean => {
  try {
    if ((import.meta as any)?.env?.DEV === true) return true;
  } catch {}
  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") return true;
    }
  } catch {}
  return false;
};

// DEV safety: clear any boot block and escape #/blocked to avoid getting stuck in local dev.
try {
  if (__icontrolIsLocalDev__()) {
    const w = window as any;
    if (w.__bootBlock) {
      delete w.__bootBlock;
      delete w.__BOOT_BLOCK_REDIRECTED__;
    }
    const h = String(window.location.hash || "");
    if (h === "#/blocked" || h.startsWith("#/blocked?") || h.startsWith("#/blocked&")) {
      navigate("#/login");
    }
  }
} catch {}

/* DEV: entitlements de base pour éviter écran noir sur dashboard (requireEntitlement "recommendations.pro") */
try {
  if (__icontrolIsLocalDev__()) {
    const g = globalThis as any;
    if (!g.__ICONTROL_ENTITLEMENTS__) {
      g.__ICONTROL_ENTITLEMENTS__ = { "recommendations.pro": true };
    }
    const tenantId = String((g.__ICONTROL_RUNTIME__?.tenantId) || "default");
    const current = loadEntitlements(tenantId);
    if (!current || current.plan === "FREE") {
      saveEntitlements(tenantId, { ...current, plan: "ENTERPRISE" });
    }
  }
} catch {}

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
    void info("OK","console migrated", { payload: ["ADMIN_STYLE_GUARD_INIT", { kind }] });
    if (w.__ICONTROL_ADMIN_STYLE_GUARD__) return;
    w.__ICONTROL_ADMIN_STYLE_GUARD__ = {
      enabled: true,
      disableLocalOverrides: true,
      events: [] as Array<{ type: string; detail: string }>
    };
    void info("OK","console migrated", { payload: ["ADMIN_STYLE_GUARD_INIT", { kind }] });

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
      if (href.includes("/_backups/") || href.includes("/dist/")) return false;
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
          void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["ADMIN_STYLE_GUARD_BLOCK", { type: "style" }] });
        }
      }
      if (node.tagName === "LINK") {
        const link = node as HTMLLinkElement;
        if ((link.getAttribute("rel") || "").toLowerCase() === "stylesheet") {
          const ok = allowLink(link);
          if (!ok) {
            try { link.remove(); } catch {}
            w.__ICONTROL_ADMIN_STYLE_GUARD__.events.push({ type: "LINK_BLOCKED", detail: link.outerHTML.slice(0, 200) });
            void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["ADMIN_STYLE_GUARD_BLOCK", { type: "link", href: link.href }] });
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
    void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["ADMIN_STYLE_GUARD_FAILED", String(e)] });
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
        void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["CLIENT_STYLE_GUARD_BLOCK", { reason }] });
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
    void info("OK","console migrated", { payload: ["CLIENT_STYLE_GUARD_INIT", { kind }] });
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

    // Runtime config shim (si activé)
    try {
      const w = getGlobalWindow() as typeof window & { __ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__?: boolean };
      if (!w.__ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__) {
        w.__ICONTROL_RUNTIME_CONFIG_SHIM_BOOT__ = true;
        const importMeta = getImportMeta();
        // In local dev, default the shim ON to avoid runtime-config fetch loops.
        if (importMeta.env?.VITE_RUNTIME_CONFIG_SHIM === "1" || importMeta.env?.DEV) {
          registerRuntimeConfigEndpoint();
        }
      }
    } catch {}

    // Idempotence marker - NE PAS retourner si déjà monté, on doit vérifier le shell
    try {
      if (appRoot instanceof HTMLElement && appRoot.dataset) {
        // Vérifier si le shell est déjà monté (présence de #cxMain)
        const existingShell = appRoot.querySelector("#cxMain");
        if (existingShell && appRoot.dataset["uiShell"] === "UI_SHELL_NAV_V1") {
          // Shell déjà monté, juste mettre à jour __ICONTROL_MOUNT__
          __icontrol_setMountSSOT__(existingShell as HTMLElement);
          return;
        }
        appRoot.dataset["uiShell"] = "UI_SHELL_NAV_V1";
      }
    } catch {}

    /* __ICONTROL_BYPASS_SHELL_ON_CP_LOGIN__ */
const __icontrol_hash = (() => { try { return window.location.hash || ""; } catch { return ""; } })();

/**
 * NOTE: Login removed - landing pages are home-app (APP) and dashboard (CP)
 */

/**
 * Gouvernance d'UI Shell (Enterprise guardrail):
 * - Shell always mounted (login removed)
 * - EXCEPTION: Ne pas monter le shell sur #/login
 */
// Vérifier si on est sur la page de login
const isLoginPage = __icontrol_hash === "#/login" || __icontrol_hash.startsWith("#/login");

if (isLoginPage) {
  // Pour login, ne pas monter le shell - utiliser directement app
  const cxMain = document.querySelector("#cxMain") as (HTMLElement | null);
  __icontrol_setMountSSOT__(cxMain || appRoot);
} else {
  const shell = createShell(getDefaultNavItems());
      /* ICONTROL_SHELL_GLOBAL_V1 */
      try {
        (shell.root as any).dataset["icontrolShellRoot"] = "1";
      } catch {}
      try {
        __icontrol_setShellGlobal__(shell as any);
      } catch {}

  appRoot.innerHTML = "";
  appRoot.appendChild(shell.root);

  __icontrol_setMountSSOT__(shell.main);

      /* ICONTROL_SHELL_REMOUNT_CALL_V1 */
      try {
        __icontrol_mountShellIfNeeded__(
          () => getDefaultNavItems(),
          (nav) => createShell(nav)
        );
      } catch {}

  // Helper global __ICONTROL_DIAGNOSTIC__ (toujours exposé); log d’aide en DEV uniquement.
  try {
    (window as any).__ICONTROL_DIAGNOSTIC__ = () => {
      const root = document.querySelector("[data-icontrol-shell-root='1']");
      const main = document.querySelector("#cxMain");
      const burger = document.querySelector("#cxBurger");
      const drawer = document.querySelector("#cxDrawer");
      const mount = (window as any).__ICONTROL_MOUNT__;
      const appKind = (() => {
        try { return (import.meta as any)?.env?.["VITE_APP_KIND"] || "NON_DEFINI"; } catch { return "ERREUR"; }
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
    if ((import.meta as any)?.env?.DEV) {
      void info("OK","console migrated", { payload: ["💡 Pour diagnostiquer, tapez dans la console: __ICONTROL_DIAGNOSTIC__()"] });
    }
  } catch {}

}
/* END __ICONTROL_BYPASS_SHELL_ON_CP_LOGIN__ */
    try {
      const kind = __icontrol_resolveAppKind();
      if (kind === "CP") {
        const b = __br.brand;
        const sh = __icontrol_getShellGlobal__();
        if (b?.APP_DISPLAY_NAME && sh?.setBrandTitle) sh.setBrandTitle(b.APP_DISPLAY_NAME);
      }
    } catch {}
  } catch (e) {
    void error("ERR_CONSOLE_MIGRATED","console migrated", { payload: ["UI_SHELL_NAV_V1 mount failed", e] });
  }
})();
  /* ICONTROL_SHELL_HASHCHANGE_V1 */
  // NOTE: hashchange listener removed - handled by bootRouter() in router.ts
  // Duplicate listener was causing multiple router ticks
function renderShell(rid: RouteId): void {
  const mount = __icontrol_resolveMountSSOT__();
  __icontrol_setBootStage__("Boot: render");
  try {
    const boot = document.getElementById("icontrol-boot");
    if (boot && boot.parentElement) boot.parentElement.removeChild(boot);
  } catch {}
  
  // Ne pas monter le shell sur la page de login (login_cp)
  if (rid === "login_cp") {
    // Pour login, utiliser directement l'élément app sans shell
    // S'assurer que le shell n'est pas monté
    const existingShell = document.querySelector("[data-icontrol-shell-root='1']");
    if (existingShell) {
      // Si le shell est déjà monté, le retirer pour login
      const appRoot = document.getElementById("app");
      if (appRoot) {
        appRoot.innerHTML = "";
        const cxMain = document.querySelector("#cxMain") as (HTMLElement | null);
        __icontrol_setMountSSOT__(cxMain || appRoot);
}
    }
    const appRoot = document.getElementById("app") || document.body;
    logger.debug("RENDER_LOGIN_CP", { rid, mountElement: appRoot.id || "body" });
    renderRoute(rid, appRoot);
    return;
  }
  
  // Protection: vérifier que le shell est monté avant de rendre la page
  try {
    const shellRoot = document.querySelector("[data-icontrol-shell-root='1']");

    // Si on est sur une page CP et que le shell n'est pas monté, le monter
    if (!shellRoot && mount === document.getElementById("app")) {
      void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["⚠️ Shell non monté, tentative de remontage..."] });
      const appRoot = document.getElementById("app") || document.body;
      const __icontrol_kind = __icontrol_resolveAppKind();
      
      if (__icontrol_kind === "CP") {
        const shell = createShell(getDefaultNavItems());
        (shell.root as any).dataset["icontrolShellRoot"] = "1";
        __icontrol_setShellGlobal__(shell as any);
        appRoot.innerHTML = "";
        appRoot.appendChild(shell.root);
        __icontrol_setMountSSOT__(shell.main);
        void info("OK","console migrated", { payload: ["✅ Shell remonté avec succès"] });
      }
    }
  } catch (e) {
    void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["⚠️ Erreur lors de la vérification du shell:", e] });
  }
  
  renderRoute(rid, mount);
}

function __icontrol_renderBootError__(msg: string): void {
  try {
    const el = document.getElementById("app");
    if (!el) return;
    el.innerHTML = `<div style="padding:16px;text-align:center;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:var(--text, var(--text-primary));background:var(--bg, var(--bg-app));">Boot error: ${msg}</div>`;
  } catch {
    // ignore
  }
}

// UI_SHELL_NAV_V1_BOOT: ensure shell mount is completed before first route render
queueMicrotask(() => {
  try {
    // Dev watchdog: if the boot placeholder survives too long, force a first render.
    const w = window as any;
    if ((import.meta as any)?.env?.DEV && !w.__ICONTROL_BOOT_WATCHDOG__) {
      w.__ICONTROL_BOOT_WATCHDOG__ = true;
      setTimeout(() => {
        try {
          const bootEl = document.getElementById("icontrol-boot");
          if (!bootEl) return;
          logger.warn("BOOT_WATCHDOG_FORCE_RENDER", "Boot placeholder still present; forcing render.");
          try {
            bootRouter((rid) => renderShell(rid));
          } catch (e) {
            logger.warn("BOOT_WATCHDOG_ROUTER_FAILED", String(e));
          }
          // If the placeholder still exists after a forced router tick, render login directly.
          setTimeout(() => {
            try {
              const bootStillThere = document.getElementById("icontrol-boot");
              if (!bootStillThere) return;
              const mount = __icontrol_resolveMountSSOT__();
              logger.warn("BOOT_WATCHDOG_RENDER_LANDING", "Boot placeholder persists; rendering landing directly.");
              const kind = __icontrol_resolveAppKind();
              const landing = kind === "CP" ? "dashboard_cp" : "home_app";
              renderRoute(landing as RouteId, mount);
            } catch (e) {
              logger.warn("BOOT_WATCHDOG_LOGIN_FAILED", String(e));
            }
          }, 500);
        } catch (e) {
          logger.warn("BOOT_WATCHDOG_FAILED", String(e));
        }
      }, 3000);
    }
  } catch {
    // ignore
  }
  (async () => {
    __icontrol_setBootStage__("Boot: start");
    __icontrol_assertAppKind__();

    /* THEME_SSOT_APPLY_CALL_V1 */
    void __ICONTROL_APPLY_THEME_SSOT__();
    /* END THEME_SSOT_APPLY_CALL_V1 */
    /* DENSITY_SSOT_APPLY_CALL_V1 */
    void __ICONTROL_APPLY_DENSITY__();
    /* END DENSITY_SSOT_APPLY_CALL_V1 */
    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
    try {
      const { applyVersionGate } = await import("./core/runtime/versionGate");
      const mount = __icontrol_resolveMountSSOT__();
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

    // DEV fast-path: if we are still on the boot placeholder, render landing directly.
    try {
      const isDev = (import.meta as any)?.env?.DEV;
      const bootEl = document.getElementById("icontrol-boot");
      if (isDev && bootEl) {
        const mount = __icontrol_resolveMountSSOT__();
        const kind = __icontrol_resolveAppKind();
        const landing = kind === "CP" ? "dashboard_cp" : "home_app";
        renderRoute(landing as RouteId, mount);
      }
    } catch (e) {
      logger.warn("WARN_DEV_FASTPATH_LANDING", String(e));
    }

    __icontrol_setBootStage__("Boot: router");
    bootRouter((rid) => renderShell(rid));
  })().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("BOOT_FAILED", msg);
    __icontrol_renderBootError__(msg);
  });
});


// DEV-only: expose diagnostic surface (no navigation, no hash writes)
if ((import.meta as any).env?.DEV) {
  try {
    installIControlDiagnosticDEVOnly();
  } catch {
    // DEV-only hardening: do not break runtime if diagnostic fails
  }
}


/**
 * Canonical tenant hydration (P3.5).
 * Future: replace global injection with auth/session provider.
 */
(async () => {
  try {
    const ctx = resolveRuntimeContext();
    await hydrateTenantRuntime(ctx);
  } catch {
    // fail-soft: app keeps defaults
  }
})();
