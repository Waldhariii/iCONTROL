;(() => {
  try {
    if (typeof window === "undefined") return;

    // Détection CP sans import.meta (compat esbuild)
    const kind =
      (((globalThis as any).__icontrolResolveAppKind && (globalThis as any).__icontrolResolveAppKind()) || "");
    const isCP = (kind === "CP") || (window.location.pathname || "").startsWith("/cp/");

    if (!isCP) return;

    const h = String(window.location.hash || "");
    if (h === "#/dashboard" || h.startsWith("#/dashboard?") || h.startsWith("#/dashboard&")) {
      const base = window.location.href.split("#")[0];
      window.location.replace(base + "#/dashboard");
      return;
    }
    if (h === "#/login-theme" || h.startsWith("#/login-theme?") || h.startsWith("#/login-theme&")) {
      const base = window.location.href.split("#")[0];
      window.location.replace(base + "#/theme-studio");
      return;
    }
  } catch (_) {}
})(); 
// === CLIENT_V2_SSOT_BEGIN ===
// Single Source of Truth: CLIENT_V2 route IDs (APP-only routes with _app suffix)
// Complete separation: All routes are globally unique with _app/_cp suffix
const CLIENT_V2_ROUTE_IDS = [
  "home_app",
  "dashboard_app",
  "login_app",
  "account_app",
  "settings_app",
  "clients_app",
  "jobs_app",
  "registry_app",
  "gallery_app",
  "client_disabled_app",
  "client_catalog_app",
  "pages_inventory_app",
  "access_denied_app",
  "notfound_app",
] as const;

// Map route IDs to hash paths (route_id -> hash path) - SSOT alignment with ROUTE_CATALOG.json
const CLIENT_V2_ROUTE_ID_TO_HASH: Record<string, string> = {
  home_app: "#/home-app",
  dashboard_app: "#/dashboard",
  login_app: "#/login",
  account_app: "#/account",
  settings_app: "#/settings",
  clients_app: "#/clients",
  jobs_app: "#/jobs",
  registry_app: "#/registry",
  gallery_app: "#/gallery",
  client_disabled_app: "#/client-disabled",
  client_catalog_app: "#/__ui-catalog-client",
  pages_inventory_app: "#/pages-inventory",
  access_denied_app: "#/access-denied",
  notfound_app: "#/notfound",
};

// Generated guards from SSOT (3 variants for different contexts)
const __CLIENT_V2_ALLOWED_HASH_ROUTES = new Set(CLIENT_V2_ROUTE_IDS.map((r) => CLIENT_V2_ROUTE_ID_TO_HASH[r]!));
const __CLIENT_V2_ALLOW = new Set(CLIENT_V2_ROUTE_IDS.map((r) => CLIENT_V2_ROUTE_ID_TO_HASH[r]!));
const __CLIENT_V2_ALLOWLIST = new Set(CLIENT_V2_ROUTE_IDS.map((r) => CLIENT_V2_ROUTE_ID_TO_HASH[r]!.replace("#", "")));

// Self-check: verify no duplicates after normalization (WARN only, non-blocking)
if (__CLIENT_V2_ALLOWED_HASH_ROUTES.size !== CLIENT_V2_ROUTE_IDS.length) {
  void warn("WARN_CONSOLE_MIGRATED", "console migrated", {
    payload: {
      code: "WARN_CLIENT_V2_DUPLICATES_DETECTED",
      expected: CLIENT_V2_ROUTE_IDS.length,
      actual: __CLIENT_V2_ALLOWED_HASH_ROUTES.size,
    },
  });
}

function __clientV2GuardHashRoute(hashRoute: string) {
  try {
    const r = (hashRoute || "").trim();
    if (!r) return __clientV2FallbackHash("disabled");
    const rNoQuery = r.split("?")[0] || "";
    if (__CLIENT_V2_ALLOWED_HASH_ROUTES.has(rNoQuery)) return r;
    return __clientV2FallbackHash("disabled");
  } catch {
    return __clientV2FallbackHash("disabled");
  }
}
// === CLIENT_V2_SSOT_END ===

import { getSession, isLoggedIn, logout } from "./localAuth";
import { warn } from "./platform/observability/logger";
import {
  canAccessSettings,
  canAccessBranding,
  canAccessThemeStudio,
  canAccessTenants,
  canAccessProviders,
  canAccessPolicies,
  canAccessSecurity
} from "./runtime/rbac";
import { navigate as coreNavigate } from "./runtime/navigate";
import { applyVersionPolicyBootGuards } from "./policies/version_policy.runtime";
import { getGlobalWindow } from "./core/utils/types";
import { getLogger } from "./platform/observability/logger";
import { ADMIN_ROUTE_ALLOWLIST, CLIENT_ROUTE_ALLOWLIST } from "./core/ssot/routeCatalogLoader";
import { isDevOnlyAllowed } from "./core/policies/devOnly";
import { auditWarnOnce } from "./platform/audit/auditOnce";
import { guardCpSurface } from "./core/runtime/cpSurfaceGuard";

import { guardDevOnlyRouteByKey } from "./platform/routing/guards/devOnlyRouteGuard";
(() => {
  try {
    // S'applique uniquement à l'app CP (path /cp), sans dépendre de import.meta ni d'une API globale.
    if (typeof window === "undefined") return;
    const path = String(window.location.pathname || "");
    if (!path.includes("/cp")) return;

    const h = String(window.location.hash || "");
    if (h === "#/dashboard" || h.startsWith("#/dashboard?") || h.startsWith("#/dashboard&")) {
      // Force le changement d'URL AVANT toute résolution/rendu de routes.
      navigate("#/dashboard");

    }
  } catch (_e) {}
})();


// CP: décommissionner définitivement #/dashboard au bootstrap (avant résolution/rendu)
// Objectif: même sur un load direct / refresh / cache agressif, on retarget vers #/dashboard.
if (typeof window !== "undefined") {
  try {
    const h = String(window.location.hash || "");
    if (h === "#/dashboard" || h.startsWith("#/dashboard?") || h.startsWith("#/dashboard&")) {
      navigate("#/dashboard");

    }
  } catch { /* noop */ }
}

const logger = getLogger("ROUTER");


/* __CLIENT_V2_FALLBACK_NO_EXTRA_ROUTES__ (SSOT) 
   - constitution: CLIENT_ALLOWLIST_ROUTES.txt
   - routes: #/dashboard, #/account, #/settings, #/users, #/system
   - policy: ANY unknown route => fallback "#/dashboard"
   - states: disabled/denied are rendered INSIDE allowed routes (query param ?state=...)
   - Note: __CLIENT_V2_ALLOW is generated from CLIENT_V2_ROUTE_IDS (see CLIENT_V2_SSOT_BEGIN)
*/
function __clientV2NormalizeHash(h: string) {
  // APP-only normalization - use home_app
  if (!h) return "#/home-app";
  const m = String(h).match(/^#\/[^?]*/);
  return m ? m[0] : "#/home-app";
}
function __clientV2FallbackHash(state?: string) {
  // APP-only fallback - use home_app
  return state ? `#/home-app?state=${encodeURIComponent(state)}` : "#/home-app";
}

function __resolveReturnToFromHash(hash: string): string {
  try {
    const query = String(hash || "").split("?")[1] || "";
    const params = new URLSearchParams(query);
    const raw = params.get("returnTo");
    if (!raw) return "#/dashboard";
    const decoded = decodeURIComponent(raw);
    return decoded.startsWith("#/") ? decoded : "#/dashboard";
  } catch {
    return "#/dashboard";
  }
}

function __hasReturnTo(hash: string): boolean {
  try {
    const query = String(hash || "").split("?")[1] || "";
    const params = new URLSearchParams(query);
    return params.has("returnTo");
  } catch {
    return false;
  }
}
function __clientV2IsAllowed(hash: string) {
  const normalized = __clientV2NormalizeHash(hash);
  return __CLIENT_V2_ALLOW.has(normalized);
}

/**
 * router.ts — minimal hash router with RBAC guard
 * Complete separation: APP routes (_app suffix), CP routes (_cp suffix)
 * Landing: APP => #/home-app, CP => #/dashboard
 */
// Complete separation: All routeIds are globally unique with _cp or _app suffix
export type RouteId = 
  // CP routes (suffix _cp)
  "dashboard_cp" | "account_cp" | "settings_cp" | "settings_branding_cp" | "branding_cp" | "users_cp" | "system_cp" 
  | "developer_cp" | "developer_entitlements_cp" | "access_denied_cp" | "verification_cp" | "blocked_cp" | "notfound_cp"
  | "toolbox_cp" | "logs_cp" | "dossiers_cp" | "login_cp" | "login_theme_cp" | "ui_showcase_cp"
  | "tenants_cp" | "providers_cp" | "policies_cp" | "security_cp" | "entitlements_cp" | "pages_cp" | "audit_cp"
  // APP routes (suffix _app)
  | "home_app" | "dashboard_app" | "login_app" | "account_app" | "settings_app" | "clients_app" | "jobs_app" | "registry_app" | "gallery_app"
  | "client_disabled_app" | "client_catalog_app" | "pages_inventory_app" | "access_denied_app" | "notfound_app";

/* CLIENT_V2_GUARD_START */
// Note: __CLIENT_V2_ALLOWLIST is generated from CLIENT_V2_ROUTE_IDS (see CLIENT_V2_SSOT_BEGIN)
function __isClientV2Allowed(pathname: string) {
  // pathname attendu style "/dashboard"
  if (!pathname) return false;
  const p = pathname.startsWith("/") ? pathname : "/" + pathname;
  return __CLIENT_V2_ALLOWLIST.has(p);
}
/* CLIENT_V2_GUARD_END */

// ADMIN_ROUTE_ALLOWLIST / CLIENT_ROUTE_ALLOWLIST — construits depuis runtime/configs/ssot/ROUTE_CATALOG.json (Phase 2.1)
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

function __icontrolIsLocalDev__(): boolean {
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
}

function __icontrolNormalizeHash__(hash: string): string {
  const h = String(hash || "").trim();
  // App-scoped fallback: CP uses dashboard, APP uses home-app
  const kind = __icontrolResolveAppKind();
  const defaultHash = kind === "CP" ? "#/dashboard" : "#/home-app";
  if (!h) return defaultHash;
  const normalized = h.startsWith("#/") ? h : `#/${h.replace(/^#?\/?/, "")}`;
  const noQuery = normalized.split("?")[0] || normalized;
  return noQuery.replace(/\/+$/, "");
}

function __icontrolIsAdminRouteAllowed__(hash: string): boolean {
  const h = __icontrolNormalizeHash__(hash);
  // Toujours autoriser #/dashboard, #/dashboard et #/login sur CP (sécurité si ROUTE_CATALOG manque ou diffère).
  if (h === "#/dashboard" || h === "#/login") return true;
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
    if (seg === "dashboard") return "dashboard_app";
    if (seg === "login") return "login_app";
    if (seg === "account") return "account_app";
    if (seg === "settings") return "settings_app";
    if (seg === "clients") return "clients_app";
    if (seg === "jobs") return "jobs_app";
    if (seg === "registry") return "registry_app";
    if (seg === "gallery") return "gallery_app";
    if (seg === "client-disabled" || seg === "client_disabled") return "client_disabled_app";
    if (seg === "client-catalog" || seg === "client_catalog" || seg === "__ui-catalog-client") return "client_catalog_app";
    if (seg === "pages-inventory" || seg === "pages_inventory") return "pages_inventory_app";
    if (seg === "access-denied") return "access_denied_app";
    if (seg === "notfound") return "notfound_app";
    return "notfound_app";
  } else {
    // CP-only routes (suffix _cp)
    if (!seg) return "dashboard_cp";
    if (seg === "login") return "login_cp";
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
    if (seg === "security") return canAccessSecurity() ? "security_cp" : "dashboard_cp";
    if (seg === "policies") return canAccessPolicies() ? "policies_cp" : "dashboard_cp";
    if (seg === "providers") return canAccessProviders() ? "providers_cp" : "dashboard_cp";
    if (seg === "tenants") return canAccessTenants() ? "tenants_cp" : "dashboard_cp";
    if (seg === "settings") return canAccessSettings() ? "settings_cp" : "dashboard_cp";
    if (seg === "settings/branding") return canAccessSettings() ? "settings_branding_cp" : "dashboard_cp";
    if (seg === "branding") return canAccessBranding() ? "branding_cp" : "dashboard_cp";
    if (seg === "entitlements") return "entitlements_cp";
    if (seg === "pages") return "pages_cp";
    if (seg === "audit") return "audit_cp";
    if (seg === "blocked") return "blocked_cp";
    if (seg === "login-theme" || seg === "theme-studio") return canAccessThemeStudio() ? "login_theme_cp" : "dashboard_cp";
    if (seg === "ui-showcase") {
  /* ICONTROL_CP_UI_SHOWCASE_ROUTER_GUARD */
  if (!isDevOnlyAllowed()) {
    auditWarnOnce("WARN_DEV_ONLY_ROUTE_BLOCKED", { scope: "cp", route: "ui-showcase" });
    return "dashboard_cp";
  }
  const fb = guardDevOnlyRouteByKey("ui-showcase") as RouteId | null;
      if (fb) return fb;
            return "ui_showcase_cp";
}
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
    if (seg === "dashboard") return "dashboard_app";
    if (seg === "login") return "login_app";
    if (seg === "account") return "account_app";
    if (seg === "settings") return "settings_app";
    if (seg === "clients") return "clients_app";
    if (seg === "jobs") return "jobs_app";
    if (seg === "registry") return "registry_app";
    if (seg === "gallery") return "gallery_app";
    if (seg === "client-disabled" || seg === "client_disabled") return "client_disabled_app";
    if (seg === "client-catalog" || seg === "client_catalog" || seg === "__ui-catalog-client") return "client_catalog_app";
    if (seg === "pages-inventory" || seg === "pages_inventory") return "pages_inventory_app";
    if (seg === "access-denied") return "access_denied_app";
    if (seg === "notfound") return "notfound_app";
    return "notfound_app";
  } else {
    // CP-only routes (suffix _cp)
    if (!seg) return "dashboard_cp";
    if (seg === "login") return "login_cp";
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
    if (seg === "security") return "security_cp";
    if (seg === "policies") return "policies_cp";
    if (seg === "providers") return "providers_cp";
    if (seg === "settings") return "settings_cp";
    if (seg === "settings/branding") return "settings_branding_cp";
    if (seg === "branding") return "branding_cp";
    if (seg === "tenants") return "tenants_cp";
    if (seg === "entitlements") return "entitlements_cp";
    if (seg === "pages") return "pages_cp";
    if (seg === "audit") return "audit_cp";
    if (seg === "blocked") return "blocked_cp";
    if (seg === "login-theme" || seg === "theme-studio") return "login_theme_cp";
    return "notfound_cp";
  }
}

function resolveCpSurfaceKeyFromRid(rid: RouteId): string | null {
  switch (rid) {
    case "dashboard_cp":
      return "cp.dashboard";
    case "login_cp":
      return "cp.login";
    case "login_theme_cp":
      return "cp.login-theme";
    case "settings_cp":
    case "settings_branding_cp":
      return "cp.settings";
    case "branding_cp":
      return "cp.branding";
    case "tenants_cp":
      return "cp.tenants";
    case "providers_cp":
      return "cp.providers";
    case "policies_cp":
      return "cp.policies";
    case "security_cp":
      return "cp.security";
    case "entitlements_cp":
      return "cp.entitlements";
    case "pages_cp":
      return "cp.pages";
    case "audit_cp":
      return "cp.audit";
    case "users_cp":
      return "cp.users";
    case "account_cp":
      return "cp.account";
    case "developer_cp":
      return "cp.developer";
    case "developer_entitlements_cp":
      return "cp.developer-entitlements";
    case "toolbox_cp":
      return "cp.toolbox";
    default:
      return null;
  }
}

export function navigate(hash: string): void {
  // Hard redirect: la landing CP "dashboard" est décommissionnée.
  if (hash === "#/dashboard" || hash.startsWith("#/dashboard?") || hash.startsWith("#/dashboard&")) {
    hash = "#/dashboard";
  }
if (!hash.startsWith("#/")) coreNavigate("#/" + hash.replace(/^#\/?/, ""));
  else coreNavigate(hash);
}

function ensureAuth(): boolean {
  const h = String(location.hash || "");
  const rid = getRouteId();
  // Allow blocked and access_denied pages always (with _cp/_app suffix)
  if (rid === "blocked_cp") {
    // In dev, avoid staying on blocked when not authenticated.
    if (!isLoggedIn()) {
      navigate("#/login");
      return false;
    }
    return true;
  }
  if (__icontrolResolveAppKind() === "CP" && (rid === "access_denied_cp" || rid === "login_cp")) return true;
  if (__icontrolResolveAppKind() === "APP" && (rid === "access_denied_app" || rid === "client_disabled_app" || rid === "client_catalog_app" || rid === "home_app")) return true;

  // Everything else requires a session
  if (!isLoggedIn()) {
    // Redirect to app-scoped landing (no shared routes)
    if (__icontrolResolveAppKind() === "APP") {
      // APP: redirect to home_app
      navigate("#/home-app?state=disabled");
    } else {
      // CP: redirect to login_cp with returnTo
      const rt = h ? encodeURIComponent(h) : encodeURIComponent("#/dashboard");
      navigate(`#/login?returnTo=${rt}`);
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
    navigate("#/dashboard");
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
    // If authenticated and on login WITH returnTo, redirect to target.
    if (isLoggedIn() && (h === "#/login" || h.startsWith("#/login")) && __hasReturnTo(h)) {
      const target = __resolveReturnToFromHash(h);
      coreNavigate(target);
      return;
    }
    // If Version Policy blocks this build, force a controlled route once.
    // DEV safety: never enforce boot block in local dev.
    try {
      const isDev = __icontrolIsLocalDev__();
      if (isDev && w.__bootBlock) {
        delete w.__bootBlock;
        delete w.__BOOT_BLOCK_REDIRECTED__;
      }
    } catch {}
    if (w.__bootBlock && !w.__BOOT_BLOCK_REDIRECTED__) {
      w.__BOOT_BLOCK_REDIRECTED__ = true;
      const blockedRoute = __icontrolResolveAppKind() === "CP" ? "#/blocked" : "#/home-app?state=blocked";
      try { coreNavigate(blockedRoute); } catch {}
      return;
    }
    // DEV safety: never allow being stuck on #/blocked in local dev.
    try {
      const isDev = __icontrolIsLocalDev__();
      if (isDev) {
        const hh = String(location.hash || "");
        if (hh === "#/blocked" || hh.startsWith("#/blocked?") || hh.startsWith("#/blocked&")) {
          try { delete w.__bootBlock; } catch {}
          try { delete w.__BOOT_BLOCK_REDIRECTED__; } catch {}
          const target = __icontrolResolveAppKind() === "CP" ? "#/dashboard" : "#/home-app";
          coreNavigate(target);
          return;
        }
      }
    } catch {}
/* ICONTROL_ROUTER_TRACE_V1 */
    // ADMIN_ROUTE_GUARD_V1 (CP only)
    try {
      if (__icontrolResolveAppKind() === "CP") {
        const allowed = __icontrolIsAdminRouteAllowed__(h);
        if (!allowed) {
          void warn("WARN_CONSOLE_MIGRATED", "console migrated", {
            payload: { code: "ADMIN_ROUTE_GUARD_BLOCK", route: h },
          });
          // Si on est déjà sur login, ne pas rediriger (éviter la boucle)
          if (h === "#/login" || h.startsWith("#/login")) {
            // Laisser passer pour permettre le rendu de la page de login
          } else {
            // Redirection vers #/login si non connecté, sinon #/dashboard
            const target = isLoggedIn()
              ? "#/dashboard"
              : `#/login?returnTo=${encodeURIComponent(h || "#/dashboard")}`;
            try { coreNavigate(target); } catch {}
            return;
          }
        }
      }
    } catch (e) {
      // Si le guard échoue (exception), rediriger vers #/login si non connecté
      try {
        void warn("WARN_CONSOLE_MIGRATED", "console migrated", {
          payload: { code: "ADMIN_ROUTE_GUARD_FAILED", error: String(e) },
        });
        if (__icontrolResolveAppKind() === "CP") {
          const target = isLoggedIn() ? "#/dashboard" : "#/login";
          coreNavigate(target);
        }
      } catch {}
      return;
    }

    // CLIENT_ROUTE_GUARD_V1 (APP only)
    try {
      if (__icontrolResolveAppKind() === "APP") {
        const allowed = __icontrolIsClientRouteAllowed__(h);
        if (!allowed) {
          // Anti-boucle: vérifier qu'on n'est pas déjà sur home-app
          const normalized = __icontrolNormalizeHash__(h);
          if (normalized === "#/home-app" || normalized === "#/home-app?state=disabled") {
            // Déjà sur la route de fallback, ne pas rediriger
            return;
          }
          void warn("WARN_CONSOLE_MIGRATED", "console migrated", {
            payload: { code: "CLIENT_ROUTE_GUARD_BLOCK", route: h },
          });
          try { coreNavigate("#/home-app?state=disabled"); } catch {}
          return;
        }
      }
    } catch (e) {
      try {
        void warn("WARN_CONSOLE_MIGRATED", "console migrated", {
          payload: { code: "CLIENT_ROUTE_GUARD_FAILED", error: String(e) },
        });
        const normalized = __icontrolNormalizeHash__(h);
        if (__icontrolResolveAppKind() === "APP" && normalized !== "#/home-app" && normalized !== "#/home-app?state=disabled") {
          coreNavigate("#/home-app?state=disabled");
        }
      } catch {}
      return;
    }

    const authed = ensureAuth();
    // Router trace logging removed - use logger if needed
    // Si l'utilisateur n'est pas authentifié, ensureAuth() a déjà redirigé
    // Mais on doit quand même rendre la page de login si c'est la route actuelle
    if (!authed && rid !== ("login_cp" as RouteId)) {
      // Debug: logger pour comprendre pourquoi on ne rend pas
      if (rid !== "login_cp") {
        logger.debug("ROUTER_SKIP_RENDER", { rid, authed, hash: h });
      }
      return;
    }
    
    // ICONTROL_PAGE_ACCESS_GUARD_V1: Check page access policy
    // Skip pour login_cp (accessible sans authentification)
    if (rid !== "login_cp") {
      try {
        const { guardRouteAccess } = await import("./core/control-plane/guards/pageAccessGuard");
        const accessCheck = await guardRouteAccess(rid);
        if (!accessCheck.allowed) {
          logger.warn("ROUTE_ACCESS_DENIED", { route: h, reason: accessCheck.reason });
          // Redirection vers landing app-scoped sans state=denied (éviter affichage « Accès refusé »).
          try { 
            const landing = __icontrolResolveAppKind() === "CP" ? "#/dashboard" : "#/home-app";
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
    }

    // CP Surface Guard (entitlements/capabilities)
    try {
      if (__icontrolResolveAppKind() === "CP") {
        const alwaysAllowed = new Set<RouteId>([
          "login_cp",
          "blocked_cp",
          "access_denied_cp",
          "notfound_cp",
        ]);
        if (!alwaysAllowed.has(rid)) {
          const surfaceKey = resolveCpSurfaceKeyFromRid(rid);
          if (surfaceKey) {
            const s = getSession();
            const actorId = String((s as any)?.username || (s as any)?.userId || "");
            const tenantId = String((globalThis as any).__ICONTROL_RUNTIME__?.tenantId || "default");
            const decision = guardCpSurface({ tenantId, actorId, surfaceKey });
            if (!decision.allow) {
              logger.warn("CP_SURFACE_DENIED", { rid, surfaceKey, reason: decision.reasonCode });
              const target = decision.redirectTo ? decision.redirectTo.replace("/cp/", "") : "#/blocked";
              try { coreNavigate(target); } catch {}
              return;
            }
          }
        }
      }
    } catch (e) {
      logger.warn("CP_SURFACE_GUARD_FAILED", String(e));
    }
    
    // Debug: logger pour confirmer qu'on appelle onRoute
    logger.debug("ROUTER_CALL_ONROUTE", { rid, hash: h });
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
  const mount = (w && w.__ICONTROL_MOUNT__) as (HTMLElement | undefined);
  const cxMain = document.querySelector("#cxMain") as (HTMLElement | null);
  const app = document.getElementById("app") as (HTMLElement | null);
  return mount || cxMain || app || document.body;
}
/* ===== END ICONTROL_MOUNT_TARGET_V1 ===== */


export function applyClientV2Guards(): void {
  /* CLIENT_V2_WIRE */
  try {
    const kind = (import.meta as any)?.env?.VITE_APP_KIND || (window as any).__VITE_APP_KIND;
    if (String(kind).toLowerCase() === "app") {
      const h = (window.location && window.location.hash) ? window.location.hash : "";
      const m = h.match(/^#(\/[^?]*)/);
      const path = (m && m[1]) ? m[1] : "/";
      if (!__isClientV2Allowed(path) && !["/client-disabled","/access-denied"].includes(path)) {
        coreNavigate(__clientV2FallbackHash("disabled"));
      }
    }
  } catch {}

  // Client V2 guard (no extra routes) — fallback after app/cp guard. APP only; CP uses dashboard, dashboard_cp, etc.
  try {
    if (__icontrolResolveAppKind() === "APP") {
      const __h = window.location.hash || "";
      // Ne rediriger que si le hash n'est pas vide et n'est pas autorisé
      // Si hash vide, laisser le router gérer (il redirigera vers home-app via getRouteId)
      if (__h) {
        // Normaliser le hash pour la comparaison
        const normalized = __clientV2NormalizeHash(__h);
        const fallbackNormalized = __clientV2NormalizeHash(__clientV2FallbackHash());
        
        // Si on est déjà sur la route de fallback, ne pas rediriger (évite la boucle)
        if (normalized === fallbackNormalized) {
          return;
        }
        
        // Vérifier si la route est autorisée
        if (!__clientV2IsAllowed(__h)) {
          // Anti-boucle: vérifier qu'on n'a pas déjà redirigé récemment
          const lastRedirect = (globalThis as any).__ICONTROL_LAST_CLIENT_V2_REDIRECT__;
          const now = Date.now();
          if (lastRedirect && lastRedirect.hash === fallbackNormalized && (now - lastRedirect.ts) < 2000) {
            return; // Éviter la boucle
          }
          (globalThis as any).__ICONTROL_LAST_CLIENT_V2_REDIRECT__ = { hash: fallbackNormalized, ts: now };
          coreNavigate(__clientV2FallbackHash());
        }
      }
    }
  } catch {}
}
