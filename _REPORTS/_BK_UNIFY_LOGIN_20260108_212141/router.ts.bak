import { getSession, isLoggedIn, logout } from "./localAuth";

/**
 * router.ts — minimal hash router with RBAC guard
 * Public:  #/login
 * Private: #/dashboard (and everything else by default)
 */
export type RouteId = "login" | "dashboard" | "notfound";

export function getRouteId(): RouteId {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const seg = (h.split("?")[0] || "").trim();
  if (!seg || seg === "login") return "login";
  if (seg === "dashboard") return "dashboard";
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
