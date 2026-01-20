import { getSession, isLoggedIn, logout } from "./localAuth";
import { canAccessSettings } from "./runtime/rbac";
import { navigate as coreNavigate } from "./runtime/navigate";
import { applyVersionPolicyBootGuards } from "./policies/version_policy.runtime";
import { getGlobalWindow, type WindowWithIControl } from "./core/utils/types";
/**
 * router.ts — minimal hash router with RBAC guard
 * Public:  #/login
 * Private: #/dashboard (and everything else by default)
 */
export type RouteId = "login" | "dashboard" | "settings" | "settings_branding" | "blocked" | "notfound"
  | "runtime_smoke" | "users" | "account" | "developer" | "developer_entitlements" | "access_denied" | "verification" | "toolbox" | "ui_catalog"
  | "system" | "logs" | "dossiers"
  | "tenants" | "entitlements" | "pages" | "feature-flags" | "publish" | "audit" | "subscription"; // Routes CP
export function getRouteId(): RouteId {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const seg = (h.split("?")[0] || "").trim();
  if (!seg || seg === "login") return "login";
  if (seg === "dashboard") return "dashboard";
  
  // Routes APP (Client)
  if (seg === "users") return "users";
  if (seg === "account") return "account";
  if (seg === "developer/entitlements" || seg === "dev/entitlements") return "developer_entitlements";
  if (seg === "developer" || seg === "dev") return "developer";
  if (seg === "access-denied") return "access_denied";
  if (seg === "__ui-catalog" || seg === "ui-catalog") return "ui_catalog";
  if (seg === "toolbox" || seg === "dev-tools" || seg === "devtools") return "toolbox";
  if (seg === "system") return "system";
  if (seg === "logs") return "logs";
  if (seg === "dossiers") return "dossiers";
  if (seg === "verification" || seg === "verify") return "verification";
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
  
  // Routes communes
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
  const tick = () => {
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
    const authed = ensureAuth();
    // If Version Policy blocks this build, force a controlled route once.
    if (w.__bootBlock && !w.__BOOT_BLOCK_REDIRECTED__) {
      w.__BOOT_BLOCK_REDIRECTED__ = true;
      try { coreNavigate("#/blocked"); } catch {}
      return;
    }
/* ICONTROL_ROUTER_TRACE_V1 */
    // Router trace logging removed - use logger if needed
    if (!authed) return;
    
    // ICONTROL_PAGE_ACCESS_GUARD_V1: Check page access policy
    try {
      const { guardRouteAccess } = await import("./core/control-plane/guards/pageAccessGuard");
      const accessCheck = await guardRouteAccess(h);
      if (!accessCheck.allowed) {
        logger.warn("ROUTE_ACCESS_DENIED", { route: h, reason: accessCheck.reason });
        try { coreNavigate("#/access-denied"); } catch (e) {
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
