// === CLIENT_V2_SSOT_BEGIN ===
// Single Source of Truth: CLIENT_V2 route IDs (APP-only routes with _app suffix)
// Complete separation: All routes are globally unique with _app/_cp suffix
const CLIENT_V2_ROUTE_IDS = ['home_app', 'client_disabled_app', 'client_catalog_app', 'pages_inventory_app', 'access_denied_app'] as const;

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
    const rNoQuery = r.split("?")[0];
    if (__CLIENT_V2_ALLOWED_HASH_ROUTES.has(rNoQuery)) return r;
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
  // APP-only normalization - use home_app
  if (!h) return "#/home-app";
  const m = String(h).match(/^#\/[^?]*/);
  return m ? m[0] : "#/home-app";
}
function __clientV2FallbackHash(state) {
  // APP-only fallback - use home_app
  return state ? `#/home-app?state=${encodeURIComponent(state)}` : "#/home-app";
}
function __clientV2IsAllowed(hash) {
  return __CLIENT_V2_ALLOW.has(__clientV2NormalizeHash(hash));
}

/**
 * router.ts — minimal hash router with RBAC guard
 * Complete separation: APP routes (_app suffix), CP routes (_cp suffix)
 * Landing: APP => #/home-app, CP => #/home-cp
 */
// Complete separation: All routeIds are globally unique with _cp or _app suffix
export type RouteId = 
  // CP routes (suffix _cp)
  "home_cp" | "dashboard_cp" | "account_cp" | "settings_cp" | "settings_branding_cp" | "users_cp" | "system_cp" 
  | "developer_cp" | "developer_entitlements_cp" | "access_denied_cp" | "verification_cp" | "blocked_cp" | "notfound_cp"
  | "toolbox_cp" | "ui_catalog_cp" | "runtime_smoke_cp" | "logs_cp" | "dossiers_cp"
  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp" | "shell-debug_cp"
  // APP routes (suffix _app)
  | "home_app" | "client_disabled_app" | "client_catalog_app" | "pages_inventory_app" | "access_denied_app" | "notfound_app";

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
  // App-scoped fallback: CP uses home-cp, APP uses home-app
  const kind = __icontrolResolveAppKind();
  const defaultHash = kind === "CP" ? "#/home-cp" : "#/home-app";
  if (!h) return defaultHash;
  const normalized = h.startsWith("#/") ? h : `#/${h.replace(/^#?\/?/, "")}`;
  const noQuery = normalized.split("?")[0] || normalized;
  return noQuery.replace(/\/+$/, "");
}

function __icontrolIsAdminRouteAllowed__(hash: string): boolean {
  const h = __icontrolNormalizeHash__(hash);
  // Toujours autoriser #/home-cp et #/dashboard sur CP (sécurité si ROUTE_CATALOG manque ou diffère).
  if (h === "#/home-cp" || h === "#/dashboard") return true;
  return ADMIN_ROUTE_ALLOWLIST.has(h);
}

function __icontrolIsClientRouteAllowed__(hash: string): boolean {
  const h = __icontrolNormalizeHash__(hash);
  return CLIENT_ROUTE_ALLOWLIST.has(h);
}
export function getRouteId(): RouteId {
  // Complete separation: APP and CP routes are globally unique with _app/_cp suffix
  const kind = __icontrolResolveAppKind();
  const rawHash = String(location.hash || "");
  const h = (kind === "APP" ? (__clientV2GuardHashRoute(rawHash) || rawHash) : rawHash).replace(/^#\/?/, "");
  const seg = (h.split("?")[0] || "").trim();
  
  if (kind === "APP") {
    // APP-only routes (suffix _app)
    if (!seg) return "home_app";
    if (seg === "home-app" || seg === "home_app") return "home_app";
    if (seg === "client-disabled" || seg === "client_disabled") return "client_disabled_app";
    if (seg === "client-catalog" || seg === "client_catalog" || seg === "__ui-catalog-client") return "client_catalog_app";
    if (seg === "pages-inventory" || seg === "pages_inventory") return "pages_inventory_app";
    if (seg === "access-denied") return "access_denied_app";
    return "notfound_app";
  } else {
    // CP-only routes (suffix _cp)
    if (!seg) return "home_cp";
    if (seg === "home-cp" || seg === "home_cp") return "home_cp";
    if (seg === "dashboard") return "dashboard_cp";
    if (seg === "users") return "users_cp";
    if (seg === "account") return "account_cp";
    if (seg === "developer/entitlements" || seg === "dev/entitlements") return "developer_entitlements_cp";
    if (seg === "developer" || seg === "dev") return "developer_cp";
    if (seg === "access-denied") return "access_denied_cp";
    if (seg === "toolbox" || seg === "dev-tools" || seg === "devtools") return "toolbox_cp";
    if (seg === "system") return "system_cp";
    if (seg === "logs") return "logs_cp";
    if (seg === "dossiers") return "dossiers_cp";
    if (seg === "verification" || seg === "verify") return "verification_cp";
    if (seg === "settings") return canAccessSettings() ? "settings_cp" : "home_cp";
    if (seg === "settings/branding") return canAccessSettings() ? "settings_branding_cp" : "home_cp";
    if (seg === "tenants") return "tenants_cp";
    if (seg === "entitlements") return "entitlements_cp";
    if (seg === "pages") return "pages_cp";
    if (seg === "feature-flags") return "feature-flags_cp";
    if (seg === "publish") return "publish_cp";
    if (seg === "audit") return "audit_cp";
    if (seg === "subscription") return "subscription_cp";
    if (seg === "integrations") return "integrations_cp";
    if (seg === "shell-debug" || seg === "debug-shell") return "shell-debug_cp";
    if (seg === "runtime-smoke" || seg === "runtime_smoke") return "runtime_smoke_cp";
    if (seg === "blocked") return "blocked_cp";
    return "notfound_cp";
  }
}

/** Déduit le route_id à partir du hash (pour guardRouteAccess, sans canAccessSettings). */
export function getRouteIdFromHash(hash: string): RouteId {
  // Complete separation: APP and CP routes are globally unique with _app/_cp suffix
  const kind = __icontrolResolveAppKind();
  const h = String(hash || "").replace(/^#\/?/, "");
  const seg = (h.split("?")[0] || "").trim();
  
  if (kind === "APP") {
    // APP-only routes (suffix _app)
    if (!seg) return "home_app";
    if (seg === "home-app" || seg === "home_app") return "home_app";
    if (seg === "client-disabled" || seg === "client_disabled") return "client_disabled_app";
    if (seg === "client-catalog" || seg === "client_catalog" || seg === "__ui-catalog-client") return "client_catalog_app";
    if (seg === "pages-inventory" || seg === "pages_inventory") return "pages_inventory_app";
    if (seg === "access-denied") return "access_denied_app";
    return "notfound_app";
  } else {
    // CP-only routes (suffix _cp)
    if (!seg) return "home_cp";
    if (seg === "home-cp" || seg === "home_cp") return "home_cp";
    if (seg === "dashboard") return "dashboard_cp";
    if (seg === "users") return "users_cp";
    if (seg === "account") return "account_cp";
    if (seg === "developer/entitlements" || seg === "dev/entitlements") return "developer_entitlements_cp";
    if (seg === "developer" || seg === "dev") return "developer_cp";
    if (seg === "access-denied") return "access_denied_cp";
    if (seg === "toolbox" || seg === "dev-tools" || seg === "devtools") return "toolbox_cp";
    if (seg === "system") return "system_cp";
    if (seg === "logs") return "logs_cp";
    if (seg === "dossiers") return "dossiers_cp";
    if (seg === "verification" || seg === "verify") return "verification_cp";
    if (seg === "settings") return "settings_cp";
    if (seg === "settings/branding") return "settings_branding_cp";
    if (seg === "tenants") return "tenants_cp";
    if (seg === "entitlements") return "entitlements_cp";
    if (seg === "pages") return "pages_cp";
    if (seg === "feature-flags") return "feature-flags_cp";
    if (seg === "publish") return "publish_cp";
    if (seg === "audit") return "audit_cp";
    if (seg === "subscription") return "subscription_cp";
    if (seg === "integrations") return "integrations_cp";
    if (seg === "shell-debug" || seg === "debug-shell") return "shell-debug_cp";
    if (seg === "runtime-smoke" || seg === "runtime_smoke") return "runtime_smoke_cp";
    if (seg === "blocked") return "blocked_cp";
    return "notfound_cp";
  }
}

export function navigate(hash: string): void {
  if (!hash.startsWith("#/")) coreNavigate("#/" + hash.replace(/^#\/?/, ""));
  else coreNavigate(hash);
}

function ensureAuth(): boolean {
  const rid = getRouteId();
  // Allow blocked and access_denied pages always (with _cp/_app suffix)
  if (rid === "blocked_cp") return true;
  if (__icontrolResolveAppKind() === "CP" && rid === "access_denied_cp") return true;
  if (__icontrolResolveAppKind() === "APP" && (rid === "access_denied_app" || rid === "client_disabled_app" || rid === "client_catalog_app" || rid === "home_app")) return true;

  // Everything else requires a session
  if (!isLoggedIn()) {
    // Redirect to app-scoped landing (no shared routes)
    if (__icontrolResolveAppKind() === "APP") {
      // APP: redirect to home_app
      navigate("#/home-app?state=disabled");
    } else {
      // CP: redirect to home_cp
      navigate("#/home-cp");
    }
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
  // Redirect to app-scoped landing (no shared routes)
  if (__icontrolResolveAppKind() === "APP") {
    navigate("#/home-app");
  } else {
    navigate("#/home-cp");
  }
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
      const blockedRoute = __icontrolResolveAppKind() === "CP" ? "#/blocked" : "#/home-app?state=blocked";
      try { coreNavigate(blockedRoute); } catch {}
      return;
    }
/* ICONTROL_ROUTER_TRACE_V1 */
    // ADMIN_ROUTE_GUARD_V1 (CP only)
    try {
      if (__icontrolResolveAppKind() === "CP") {
        const allowed = __icontrolIsAdminRouteAllowed__(h);
        if (!allowed) {
          console.warn("ADMIN_ROUTE_GUARD_BLOCK", { route: h });
          // Redirection vers #/home-cp (sans state=denied pour éviter « Accès refusé »).
          try { coreNavigate("#/home-cp"); } catch {}
          return;
        }
      }
    } catch (e) {
      // Si le guard échoue (exception), rediriger vers #/dashboard (éviter state=denied / « Accès refusé »).
      try {
        console.warn("ADMIN_ROUTE_GUARD_FAILED", String(e));
        if (__icontrolResolveAppKind() === "CP") coreNavigate("#/home-cp");
      } catch {}
      return;
    }

    // CLIENT_ROUTE_GUARD_V1 (APP only)
    try {
      if (__icontrolResolveAppKind() === "APP") {
        const allowed = __icontrolIsClientRouteAllowed__(h);
        if (!allowed) {
          console.warn("CLIENT_ROUTE_GUARD_BLOCK", { route: h });
          try { coreNavigate("#/home-app?state=disabled"); } catch {}
          return;
        }
      }
    } catch (e) {
      try {
        console.warn("CLIENT_ROUTE_GUARD_FAILED", String(e));
        if (__icontrolResolveAppKind() === "APP") coreNavigate("#/home-app?state=disabled");
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
        // Redirection vers landing app-scoped sans state=denied (éviter affichage « Accès refusé »).
        try { 
          const landing = __icontrolResolveAppKind() === "CP" ? "#/home-cp" : "#/home-app";
          coreNavigate(landing);
        } catch (e) {
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

  // Client V2 guard (no extra routes) — fallback after app/cp guard. APP only; CP uses home-cp, dashboard_cp, etc.
  try {
    if (__icontrolResolveAppKind() === "APP") {
      const __h = window.location.hash || "#/dashboard";
      if (!__clientV2IsAllowed(__h)) {
        coreNavigate(__clientV2FallbackHash());
      }
    }
  } catch {}
}
