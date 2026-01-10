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

const LS_SESSION = "icontrol_session_v1";

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s || typeof s.username !== "string" || typeof s.role !== "string") return null;
    return s;
  } catch {
    return null;
  }
}

export function setSession(next: Session): boolean {
  try {
    localStorage.setItem(LS_SESSION, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function clearSession(): void {
  try { localStorage.removeItem(LS_SESSION); } catch {}
}

export function isLoggedIn(): boolean {
  return !!getSession();
}

/**
 * Local bootstrap users (temporary).
 * Replace later with platform-services/security/auth.
 */
const BOOTSTRAP_USERS: Record<string, { password: string; role: Role }> = {
  sysadmin:  { password: "sysadmin", role: "SYSADMIN" },
  developer: { password: "developer", role: "DEVELOPER" },
  admin:     { password: "admin", role: "ADMIN" },
  Waldhari:  { password: "Dany123456@", role: "DEVELOPER" },
};

export function authenticate(username: string, password: string): { ok: true; session: Session } | { ok: false; error: string } {
  const u = (username || "").trim();
  const p = (password || "").toString();
  if (!u || !p) return { ok: false, error: "Identifiants requis." };

  const hit = BOOTSTRAP_USERS[u];
  if (!hit || hit.password !== p) return { ok: false, error: "Identifiant invalide." };

  const session: Session = { username: u, role: hit.role, issuedAt: Date.now() };
  setSession(session);
  return { ok: true, session };
}

export function logout(): void {
  clearSession();
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
    const safeRole = (normalized === "ADMIN" || normalized === "SYSADMIN" || normalized === "DEVELOPER")
      ? (normalized as Role)
      : "USER";
    const session: Session = { username: String(username || "dev"), role: safeRole, issuedAt: Date.now() };
    if (!setSession(session)) {
      console.warn("WARN_DEV_LOGIN_FAILED", "setSession_failed");
      return;
    }
    location.hash = "#/dashboard";
  };
}

const __isDev =
  typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.DEV);
if (__isDev) registerDevLoginHelper();
