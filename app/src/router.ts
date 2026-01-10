import { getSession, isLoggedIn, logout } from "./localAuth";
import { canAccessSettings } from "./runtime/rbac";

/**
 * router.ts — minimal hash router with RBAC guard
 * Public:  #/login
 * Private: #/dashboard (and everything else by default)
 */
export type RouteId = "login" | "dashboard" | "settings" | "settings_branding" | "notfound"
  | "runtime_smoke" | "users" | "account" | "developer" | "verification";
export function getRouteId(): RouteId {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const seg = (h.split("?")[0] || "").trim();
  if (!seg || seg === "login") return "login";
  if (seg === "dashboard") return "dashboard";
  if (seg === "users") return "users";
  if (seg === "account") return "account";
  if (seg === "developer" || seg === "dev") return "developer";
  if (seg === "verification" || seg === "verify") return "verification";
  if (seg === "settings") return canAccessSettings() ? "settings" : "dashboard";
  if (seg === "settings/branding") return canAccessSettings() ? "settings_branding" : "dashboard";
  if (seg === "runtime-smoke" || seg === "runtime_smoke") return "runtime_smoke";
  return "notfound";
}

export function navigate(hash: string): void {
  if (!hash.startsWith("#/")) location.hash = "#/" + hash.replace(/^#\/?/, "");
  else location.hash = hash;
}

function ensureAuth(): boolean {
  // Allow login always
  const rid = getRouteId();
  if (rid === "login") return true;

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
    if (!ensureAuth()) return;
    onRoute(getRouteId());
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
