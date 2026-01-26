// === CLIENT_V2_SSOT_BEGIN ===
// Single Source of Truth: CLIENT_V2 route IDs (deterministic order)
const CLIENT_V2_ROUTE_IDS = ['account', 'dashboard', 'settings', 'system', 'users'] as const;

// Generated guards from SSOT (3 variants for different contexts)
const __CLIENT_V2_ALLOWED_HASH_ROUTES = new Set(CLIENT_V2_ROUTE_IDS.map(r => `#/${r}`));
const __CLIENT_V2_ALLOW = new Set(CLIENT_V2_ROUTE_IDS.map(r => `#/${r}`));
const __CLIENT_V2_ALLOWLIST = new Set(CLIENT_V2_ROUTE_IDS.map(r => `/${r}`));

// Self-check: verify no duplicates after normalization (WARN only, non-blocking)
if (__CLIENT_V2_ALLOWED_HASH_ROUTES.size !== CLIENT_V2_ROUTE_IDS.length) {
  console.warn("WARN_CLIENT_V2_DUPLICATES_DETECTED", { expected: CLIENT_V2_ROUTE_IDS.length, actual: __CLIENT_V2_ALLOWED_HASH_ROUTES.size });
}

function __clientV2GuardHashRoute(hashRoute) {
  try {
    const r = (hashRoute || "").trim();
    if (!r) return __clientV2FallbackHash("disabled");
    if (__CLIENT_V2_ALLOWED_HASH_ROUTES.has(r)) return r;
    return __clientV2FallbackHash("disabled");
  } catch {
    return __clientV2FallbackHash("disabled");
  }
}
// === CLIENT_V2_SSOT_END ===

import { getSession, isLoggedIn, logout } from "./localAuth";
import { canAccessSettings } from "./runtime/rbac";
import { navigate as coreNavigate } from "./runtime/navigate";
import { applyVersionPolicyBootGuards } from "./policies/version_policy.runtime";
import { getGlobalWindow, type WindowWithIControl } from "./core/utils/types";
import { getLogger } from "./core/utils/logger";
import { ADMIN_ROUTE_ALLOWLIST, CLIENT_ROUTE_ALLOWLIST } from "./core/ssot/routeCatalogLoader";

const logger = getLogger("ROUTER");


/* __CLIENT_V2_FALLBACK_NO_EXTRA_ROUTES__ (SSOT) 
   - constitution: CLIENT_ALLOWLIST_ROUTES.txt
   - routes: #/dashboard, #/account, #/settings, #/users, #/system
   - policy: ANY unknown route => fallback "#/dashboard"
   - states: disabled/denied are rendered INSIDE allowed routes (query param ?state=...)
   - Note: __CLIENT_V2_ALLOW is generated from CLIENT_V2_ROUTE_IDS (see CLIENT_V2_SSOT_BEGIN)
*/
function __clientV2NormalizeHash(h) {
  if (!h) return "#/dashboard";
  const m = String(h).match(/^#\/[^?]*/);
  return m ? m[0] : "#/dashboard";
}
function __clientV2FallbackHash(state) {
  return state ? `#/dashboard?state=${encodeURIComponent(state)}` : "#/dashboard";
}
function __clientV2IsAllowed(hash) {
  return __CLIENT_V2_ALLOW.has(__clientV2NormalizeHash(hash));
}

/**
 * router.ts — minimal hash router with RBAC guard
 * Public:  #/login
 * Private: #/dashboard (and everything else by default)
 */
export type RouteId = "login" | "dashboard" | "settings" | "settings_branding" | "blocked" | "notfound"
  | "runtime_smoke" | "users" | "account" | "developer" | "developer_entitlements" | "access_denied" | "verification" | "toolbox" | "ui_catalog"
  | "client_disabled" | "client_catalog"
  | "system" | "logs" | "dossiers"
  | "tenants" | "entitlements" | "pages" | "feature-flags" | "publish" | "audit" | "subscription" | "integrations" | "login-theme" | "shell-debug"; // Routes CP

/* CLIENT_V2_GUARD_START */
// Note: __CLIENT_V2_ALLOWLIST is generated from CLIENT_V2_ROUTE_IDS (see CLIENT_V2_SSOT_BEGIN)
function __isClientV2Allowed(pathname: string) {
  // pathname attendu style "/dashboard"
  if (!pathname) return false;
  const p = pathname.startsWith("/") ? pathname : "/" + pathname;
  return __CLIENT_V2_ALLOWLIST.has(p);
}
/* CLIENT_V2_GUARD_END */

// ADMIN_ROUTE_ALLOWLIST / CLIENT_ROUTE_ALLOWLIST — construits depuis config/ssot/ROUTE_CATALOG.json (Phase 2.1)
// routeCatalogLoader filtre app_surface et status ACTIVE|EXPERIMENTAL. HIDDEN/DEPRECATED → guard bloque.

function __icontrolNormalizeAppKind__(raw?: string): "CP" | "APP" {
  const k = String(raw || "").trim().toUpperCase();
  if (k === "CP" || k === "CONTROL_PLANE" || k === "CONTROLPLANE" || k === "ADMIN" || k === "ADMINISTRATION") return "CP";
  if (k === "APP" || k === "CLIENT" || k === "DESKTOP_CLIENT" || k === "CLIENT_APP") return "APP";
  return "CP";
}

function __icontrolResolveAppKind(): "CP" | "APP" {
  let raw = "";
  try {
    const anyImportMeta = (import.meta as any);
    raw = String(anyImportMeta?.env?.VITE_APP_KIND || "");
  } catch {}
  try {
    if (!raw) raw = String((globalThis as any)?.__ICONTROL_APP_KIND__ || "");
  } catch {}
  return __icontrolNormalizeAppKind__(raw);
}

function __icontrolNormalizeHash__(hash: string): string {
  const h = String(hash || "").trim();
  if (!h) return "#/login";
  const normalized = h.startsWith("#/") ? h : `#/${h.replace(/^#?\/?/, "")}`;
  const noQuery = normalized.split("?")[0] || normalized;
  return noQuery.replace(/\/+$/, "");
}

function __icontrolIsAdminRouteAllowed__(hash: string): boolean {
  const h = __icontrolNormalizeHash__(hash);
  if (h === "#/login" || h.startsWith("#/login?")) return true;
  // Toujours autoriser #/dashboard sur CP (sécurité si ROUTE_CATALOG manque ou diffère).
  if (h === "#/dashboard") return true;
  return ADMIN_ROUTE_ALLOWLIST.has(h);
}

function __icontrolIsClientRouteAllowed__(hash: string): boolean {
  const h = __icontrolNormalizeHash__(hash);
  return CLIENT_ROUTE_ALLOWLIST.has(h);
}
export function getRouteId(): RouteId {
  // __clientV2GuardHashRoute: APP only. CP must use raw hash so #/login→login, #/dashboard→dashboard, etc.
  const kind = __icontrolResolveAppKind();
  const rawHash = String(location.hash || "");
  const h = (kind === "APP" ? (__clientV2GuardHashRoute(rawHash) || rawHash) : rawHash).replace(/^#\/?/, "");
  const seg = (h.split("?")[0] || "").trim();
  if (!seg || seg === "login") return "login";
  if (seg === "dashboard") return "dashboard";
  
  // Routes APP (Client)
  if (seg === "users") return "users";
  if (seg === "account") return "account";
  if (seg === "developer/entitlements" || seg === "dev/entitlements") return "developer_entitlements";
  if (seg === "developer" || seg === "dev") return "developer";
  if (seg === "access-denied") return "access_denied";
  if (seg === "toolbox" || seg === "dev-tools" || seg === "devtools") return "toolbox";
  if (seg === "system") return "system";
  if (seg === "logs") return "logs";
  if (seg === "dossiers") return "dossiers";
  if (seg === "verification" || seg === "verify") return "verification";
  if (seg === "client-disabled" || seg === "client_disabled") return "client_disabled";
  if (seg === "settings") return canAccessSettings() ? "settings" : "dashboard";
  if (seg === "settings/branding") return canAccessSettings() ? "settings_branding" : "dashboard";
  
  // Routes CP (Control Plane) - peuvent coexister avec routes APP car registries différentes
  if (seg === "tenants") return "tenants";
  if (seg === "entitlements") return "entitlements";
  if (seg === "pages") return "pages";
  if (seg === "feature-flags") return "feature-flags";
  if (seg === "publish") return "publish";
  if (seg === "audit") return "audit";
  if (seg === "subscription") return "subscription";
  if (seg === "integrations") return "integrations";
  if (seg === "login-theme" || seg === "theme-editor") return "login-theme";
  if (seg === "shell-debug" || seg === "debug-shell") return "shell-debug";
  
  // Routes communes
  if (seg === "runtime-smoke" || seg === "runtime_smoke") return "runtime_smoke";
  if (seg === "blocked") return "blocked";
  return "notfound";
}

/** Déduit le route_id à partir du hash (pour guardRouteAccess, sans canAccessSettings). */
export function getRouteIdFromHash(hash: string): RouteId {
  const h = String(hash || "").replace(/^#\/?/, "");
  const seg = (h.split("?")[0] || "").trim();
  if (!seg || seg === "login") return "login";
  if (seg === "dashboard") return "dashboard";
  if (seg === "users") return "users";
  if (seg === "account") return "account";
  if (seg === "developer/entitlements" || seg === "dev/entitlements") return "developer_entitlements";
  if (seg === "developer" || seg === "dev") return "developer";
  if (seg === "access-denied") return "access_denied";
  if (seg === "toolbox" || seg === "dev-tools" || seg === "devtools") return "toolbox";
  if (seg === "system") return "system";
  if (seg === "logs") return "logs";
  if (seg === "dossiers") return "dossiers";
  if (seg === "verification" || seg === "verify") return "verification";
  if (seg === "client-disabled" || seg === "client_disabled") return "client_disabled";
  if (seg === "settings") return "settings";
  if (seg === "settings/branding") return "settings_branding";
  if (seg === "tenants") return "tenants";
  if (seg === "entitlements") return "entitlements";
  if (seg === "pages") return "pages";
  if (seg === "feature-flags") return "feature-flags";
  if (seg === "publish") return "publish";
  if (seg === "audit") return "audit";
  if (seg === "subscription") return "subscription";
  if (seg === "integrations") return "integrations";
  if (seg === "login-theme" || seg === "theme-editor") return "login-theme";
  if (seg === "shell-debug" || seg === "debug-shell") return "shell-debug";
  if (seg === "runtime-smoke" || seg === "runtime_smoke") return "runtime_smoke";
  if (seg === "blocked") return "blocked";
  return "notfound";
}

export function navigate(hash: string): void {
  if (!hash.startsWith("#/")) coreNavigate("#/" + hash.replace(/^#\/?/, ""));
  else coreNavigate(hash);
}

function ensureAuth(): boolean {
  // Allow login always
  const rid = getRouteId();
  if (rid === "login" || rid === "blocked") return true;
  if (__icontrolResolveAppKind() === "CP" && rid === "access_denied") return true;
  if (__icontrolResolveAppKind() === "APP" && (rid === "access_denied" || rid === "client_disabled" || rid === "client_catalog")) return true;

  // Everything else requires a session
  if (!isLoggedIn()) {
    navigate("#/login");
    return false;
  }
  return true;
}

export function getUserLabel(): string {
  const s = getSession();
  if (!s) return "Invité";
  return `${s.username} (${s.role})`;
}

export function doLogout(): void {
  logout();
  navigate("#/login");
}

export function bootRouter(onRoute: (rid: RouteId) => void): void {
  const tick = async () => {
    const w = getGlobalWindow();
    if (!w.__VP_GUARDS_APPLIED__) {
      w.__VP_GUARDS_APPLIED__ = true;
      try { applyVersionPolicyBootGuards(w); } catch {}
    }

    // Observability: audit version policy outcomes (idempotent)
    try {
      if (!w.__VP_AUDITED__) w.__VP_AUDITED__ = { soft: false, block: false };
      const emit = w.audit?.emit || w.audit?.log || w.auditLog?.append || w.core?.audit?.emit;
      if (typeof emit === "function") {
        if (w.__bootBanner && !w.__VP_AUDITED__.soft) {
          w.__VP_AUDITED__.soft = true;
          emit.call(w, "WARN", w.__bootBanner.code || "WARN_VERSION_SOFT_BLOCK", w.__bootBanner.message || "Soft block: update recommended", { source: "version_policy" });
        }
        if (w.__bootBlock && !w.__VP_AUDITED__.block) {
          w.__VP_AUDITED__.block = true;
          emit.call(w, "ERR", w.__bootBlock.code || "ERR_VERSION_BLOCKED", w.__bootBlock.message || "Blocked by version policy", { source: "version_policy" });
        }
      }
    } catch {}
    const rid = getRouteId();
    const h = String(location.hash || "");
    // If Version Policy blocks this build, force a controlled route once.
    if (w.__bootBlock && !w.__BOOT_BLOCK_REDIRECTED__) {
      w.__BOOT_BLOCK_REDIRECTED__ = true;
      try { coreNavigate("#/blocked"); } catch {}
      return;
    }
/* ICONTROL_ROUTER_TRACE_V1 */
    // ADMIN_ROUTE_GUARD_V1 (CP only)
    try {
      if (__icontrolResolveAppKind() === "CP") {
        const allowed = __icontrolIsAdminRouteAllowed__(h);
        if (!allowed) {
          console.warn("ADMIN_ROUTE_GUARD_BLOCK", { route: h });
          // Redirection vers #/dashboard (sans state=denied pour éviter « Accès refusé »).
          try { coreNavigate(__clientV2FallbackHash()); } catch {}
          return;
        }
      }
    } catch (e) {
      // Si le guard échoue (exception), rediriger vers #/dashboard (éviter state=denied / « Accès refusé »).
      try {
        console.warn("ADMIN_ROUTE_GUARD_FAILED", String(e));
        if (__icontrolResolveAppKind() === "CP") coreNavigate(__clientV2FallbackHash());
      } catch {}
      return;
    }

    // CLIENT_ROUTE_GUARD_V1 (APP only)
    try {
      if (__icontrolResolveAppKind() === "APP") {
        const allowed = __icontrolIsClientRouteAllowed__(h);
        if (!allowed) {
          console.warn("CLIENT_ROUTE_GUARD_BLOCK", { route: h });
          try { coreNavigate(__clientV2FallbackHash("disabled")); } catch {}
          return;
        }
      }
    } catch (e) {
      try {
        console.warn("CLIENT_ROUTE_GUARD_FAILED", String(e));
        if (__icontrolResolveAppKind() === "APP") coreNavigate(__clientV2FallbackHash("disabled"));
      } catch {}
      return;
    }

    const authed = ensureAuth();
    // Router trace logging removed - use logger if needed
    if (!authed) return;
    
    // ICONTROL_PAGE_ACCESS_GUARD_V1: Check page access policy
    try {
      const { guardRouteAccess } = await import("./core/control-plane/guards/pageAccessGuard");
      const accessCheck = await guardRouteAccess(h);
      if (!accessCheck.allowed) {
        logger.warn("ROUTE_ACCESS_DENIED", { route: h, reason: accessCheck.reason });
        // Redirection vers #/dashboard sans state=denied (éviter affichage « Accès refusé »).
        try { coreNavigate(__clientV2FallbackHash()); } catch (e) {
          logger.error("ACCESS_DENIED_REDIRECT_FAILED", String(e));
        }
        return;
      }
    } catch (e) {
      // If guard fails, allow access (fail open)
      logger.warn("PAGE_ACCESS_GUARD_FAILED", String(e));
    }
    
    onRoute(rid);
  };
  window.addEventListener("hashchange", tick);
  tick();
}

/* ===== ICONTROL_MOUNT_TARGET_V1 =====
   If UI shell is mounted, pages should render into window.__ICONTROL_MOUNT__.
*/
export function getMountEl(): HTMLElement {
  const w = window as any;
  const el = w.__ICONTROL_MOUNT__ as HTMLElement | undefined;
  return el || (document.getElementById("app") as HTMLElement) || document.body;
}
/* ===== END ICONTROL_MOUNT_TARGET_V1 ===== */


export function applyClientV2Guards(): void {
  /* CLIENT_V2_WIRE */
  try {
    const kind = (import.meta as any)?.env?.VITE_APP_KIND || (window as any).__VITE_APP_KIND;
    if (String(kind).toLowerCase() === "app") {
      const h = (window.location && window.location.hash) ? window.location.hash : "";
      const m = h.match(/^#(\/[^?]*)/);
      const path = m ? m[1] : "/";
      if (!__isClientV2Allowed(path) && !["/client-disabled","/access-denied"].includes(path)) {
        coreNavigate(__clientV2FallbackHash("disabled"));
      }
    }
  } catch {}

  // Client V2 guard (no extra routes) — fallback after app/cp guard. APP only; CP must keep #/login, #/dashboard, etc.
  try {
    if (__icontrolResolveAppKind() === "APP") {
      const __h = window.location.hash || "#/dashboard";
      if (!__clientV2IsAllowed(__h)) {
        coreNavigate(__clientV2FallbackHash());
      }
    }
  } catch {}
}
