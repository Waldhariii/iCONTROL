import { navigate } from "./runtime/navigate";
/**
 * localAuth.ts — bootstrap auth for dev/local use
 * - No network
 * - Minimal surface: getSession / setSession / clearSession / isLoggedIn
 */
export type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER";

export type Session = {
  username: string;
  role: Role;
  issuedAt: number; // ms
};

type AuthScope = "APP" | "CP";

const LS_SESSION_APP = "icontrol_session_v1";
const LS_SESSION_MGMT = "icontrol_mgmt_session_v1";

function resolveAuthScope(): AuthScope {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyImportMeta = import.meta as any;
    const k = anyImportMeta?.env?.VITE_APP_KIND;
    if (k === "CONTROL_PLANE" || k === "CP") return "CP";
    if (k === "CLIENT_APP" || k === "APP") return "APP";
  } catch {}
  try {
    const p = typeof window !== "undefined" ? window.location.pathname : "";
    if (p.startsWith("/cp")) return "CP";
    if (p.startsWith("/app")) return "APP";
  } catch {}
  return "APP";
}

function getSessionKey(scope: AuthScope): string {
  return scope === "CP" ? LS_SESSION_MGMT : LS_SESSION_APP;
}

function getCookiePath(scope: AuthScope): string {
  return scope === "CP" ? "/cp" : "/app";
}

function setSessionCookie(scope: AuthScope): void {
  try {
    if (typeof document === "undefined") return;
    const key = getSessionKey(scope);
    const path = getCookiePath(scope);
    document.cookie = `${key}=1; Path=${path}; SameSite=Lax`;
  } catch {}
}

function clearSessionCookie(scope: AuthScope): void {
  try {
    if (typeof document === "undefined") return;
    const key = getSessionKey(scope);
    const path = getCookiePath(scope);
    document.cookie = `${key}=; Path=${path}; Max-Age=0; SameSite=Lax`;
  } catch {}
}

// ICONTROL_LOCALAUTH_STORAGE_V1: test-safe storage fallback without core deps
const mem = (() => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => void m.clear(),
  } satisfies Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear">;
})();

function getStorage(): Pick<
  Storage,
  "getItem" | "setItem" | "removeItem" | "clear"
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ls = (globalThis as any)?.localStorage;
  if (ls && typeof ls.getItem === "function") return ls;
  if (typeof window !== "undefined" && window.localStorage)
    return window.localStorage;
  return mem;
}

export function getSession(
  scope: AuthScope = resolveAuthScope(),
): Session | null {
  try {
    const raw = getStorage().getItem(getSessionKey(scope));
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s || typeof s.username !== "string" || typeof s.role !== "string")
      return null;
    return s;
  } catch {
    return null;
  }
}

export function setSession(
  next: Session,
  scope: AuthScope = resolveAuthScope(),
): boolean {
  try {
    getStorage().setItem(getSessionKey(scope), JSON.stringify(next));
    setSessionCookie(scope);
    return true;
  } catch {
    return false;
  }
}

export function clearSession(scope: AuthScope = resolveAuthScope()): void {
  try {
    getStorage().removeItem(getSessionKey(scope));
  } catch {}
  clearSessionCookie(scope);
}

export function isLoggedIn(scope: AuthScope = resolveAuthScope()): boolean {
  return !!getSession(scope);
}

/**
 * Local bootstrap users (temporary).
 * Replace later with platform-services/security/auth.
 */
const BOOTSTRAP_USERS: Record<string, { password: string; role: Role }> = {
  sysadmin: { password: "sysadmin", role: "SYSADMIN" },
  developer: { password: "developer", role: "DEVELOPER" },
  admin: { password: "admin", role: "ADMIN" },
  Waldhari: { password: "Dany123456@", role: "DEVELOPER" },
};

export function authenticate(
  username: string,
  password: string,
  scope: AuthScope = resolveAuthScope(),
): { ok: true; session: Session } | { ok: false; error: string } {
  const u = (username || "").trim();
  const p = (password || "").toString();
  if (!u || !p) return { ok: false, error: "Identifiants requis." };

  const hit = BOOTSTRAP_USERS[u];
  if (!hit || hit.password !== p)
    return { ok: false, error: "Identifiant invalide." };

  const session: Session = {
    username: u,
    role: hit.role,
    issuedAt: Date.now(),
  };
  setSession(session, scope);
  return { ok: true, session };
}

export function logout(scope: AuthScope = resolveAuthScope()): void {
  clearSession(scope);
}

export function getManagementSession(): Session | null {
  return getSession("CP");
}

export function setManagementSession(next: Session): boolean {
  return setSession(next, "CP");
}

export function clearManagementSession(): void {
  clearSession("CP");
}

export function isManagementLoggedIn(): boolean {
  return isLoggedIn("CP");
}

export function authenticateManagement(
  username: string,
  password: string,
): { ok: true; session: Session } | { ok: false; error: string } {
  return authenticate(username, password, "CP");
}

export function logoutManagement(): void {
  logout("CP");
}

export function getAppSession(): Session | null {
  return getSession("APP");
}

export function clearAppSession(): void {
  clearSession("APP");
}

/* ICONTROL_DEV_LOGIN_V1
   Dev helper: optional, explicit, no auto-login.
   Usage in console (dev only):
     window.__icontrolDevLogin?.("admin", "SYSADMIN")
*/
export function registerDevLoginHelper(): void {
  if (typeof window === "undefined") return;
  (window as any).__icontrolDevLogin = (username: string, role: string) => {
    const normalized = String(role || "USER").toUpperCase();
    const safeRole =
      normalized === "ADMIN" ||
      normalized === "SYSADMIN" ||
      normalized === "DEVELOPER"
        ? (normalized as Role)
        : "USER";
    const session: Session = {
      username: String(username || "dev"),
      role: safeRole,
      issuedAt: Date.now(),
    };
    if (!setSession(session)) {
      console.warn("WARN_DEV_LOGIN_FAILED", "setSession_failed");
      return;
    }
    navigate("#/dashboard");
  };
}

const __isDev =
  typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.DEV);
if (__isDev) registerDevLoginHelper();
