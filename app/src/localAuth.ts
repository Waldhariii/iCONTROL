import { navigate } from "./runtime/navigate";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "./core/security/rateLimiter";
import { sessionManager } from "./core/session/sessionManager";
import { isSecureUser, verifySecureUserPassword, getSecureUserData, updateSecureUserData } from "./core/security/userData";
/**
 * localAuth.ts — bootstrap auth for dev/local use
 * - No network
 * - Minimal surface: getSession / setSession / clearSession / isLoggedIn
 * - ICONTROL_SECURE_AUTH_V1: Intégration de la sécurité renforcée pour utilisateurs critiques
 */
export type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER" | "MASTER";

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
    document.cookie = `${key}=1; Path=${path}; SameSite=Strict${window.location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {}
}

function clearSessionCookie(scope: AuthScope): void {
  try {
    if (typeof document === "undefined") return;
    const key = getSessionKey(scope);
    const path = getCookiePath(scope);
    document.cookie = `${key}=; Path=${path}; Max-Age=0; SameSite=Strict${window.location.protocol === "https:" ? "; Secure" : ""}`;
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
 * ICONTROL_USERS_V1: Utilisateurs système
 * - Administration (CP): Master, Developpeur, WaldHari (sécurisé)
 * - Client (APP): SYSAdmin, Admin, Utilisateur
 * 
 * NOTE: Les utilisateurs critiques (WaldHari, Master) utilisent le système de hachage sécurisé
 * et sont gérés via userData.ts. Les autres utilisateurs utilisent des mots de passe simples
 * pour le développement.
 */
const BOOTSTRAP_USERS: Record<string, { password: string; role: Role }> = {
  // Utilisateurs Administration (CP)
  Master: { password: "1234", role: "MASTER" },
  Developpeur: { password: "1234", role: "DEVELOPER" },
  // WaldHari est géré via userData.ts avec sécurité renforcée
  // Utilisateurs Client (APP)
  SYSAdmin: { password: "1234", role: "SYSADMIN" },
  Admin: { password: "1234", role: "ADMIN" },
  Utilisateur: { password: "1234", role: "USER" },
};

// ICONTROL_USER_INDEX_V1: Index optimisé pour recherche rapide (insensible à la casse)
// Inclut les utilisateurs sécurisés (WaldHari, etc.)
const USER_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>();
  for (const key of Object.keys(BOOTSTRAP_USERS)) {
    index.set(key.toLowerCase(), key);
  }
  // Ajouter les utilisateurs sécurisés
  if (isSecureUser("WaldHari")) {
    index.set("waldhari", "WaldHari");
  }
  return index;
})();

/**
 * Vérifie si on est en mode développement
 */
function isDevMode(): boolean {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) {
      return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).process !== "undefined" && (globalThis as any).process?.env?.NODE_ENV !== "production") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function authenticate(
  username: string,
  password: string,
  scope: AuthScope = resolveAuthScope(),
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const u = (username || "").trim();
  const p = (password || "").toString().trim();
  if (!u || !p) return { ok: false, error: "Identifiants requis." };

  // ICONTROL_RATE_LIMITING_V1: Vérifier le rate limiting avant l'authentification
  const rateLimitCheck = checkRateLimit(u);
  if (!rateLimitCheck.allowed) {
    return { ok: false, error: rateLimitCheck.error || "Trop de tentatives. Veuillez réessayer plus tard." };
  }

  // ICONTROL_CASE_INSENSITIVE_USERNAME_V1: Username insensible à la casse
  // ICONTROL_USER_INDEX_V1: Utiliser l'index pour recherche O(1) au lieu de O(n)
  const uLower = u.toLowerCase();
  const matchingKey = USER_INDEX.get(uLower);
  
  if (!matchingKey) {
    // ICONTROL_SECURE_ERROR_MESSAGE_V1: Message d'erreur générique en production
    const devMode = isDevMode();
    const errorMsg = devMode
      ? `Identifiant invalide. Utilisateurs disponibles: ${Array.from(USER_INDEX.values()).join(", ")}`
      : "Identifiant ou mot de passe incorrect.";
    recordFailedAttempt(u); // Enregistrer la tentative échouée
    return { ok: false, error: errorMsg };
  }

  // ICONTROL_SECURE_USER_AUTH_V1: Vérification pour utilisateurs sécurisés (WaldHari, etc.)
  if (isSecureUser(matchingKey)) {
    const isValid = await verifySecureUserPassword(matchingKey, p);
    if (!isValid) {
      recordFailedAttempt(matchingKey);
      const userData = getSecureUserData(matchingKey);
      if (userData) {
        userData.failedLoginAttempts += 1;
        updateSecureUserData(matchingKey, userData);
      }
      return { ok: false, error: "Identifiant ou mot de passe incorrect." };
    }

    // Connexion réussie pour utilisateur sécurisé
    resetRateLimit(matchingKey);
    const userData = getSecureUserData(matchingKey);
    if (userData) {
      userData.failedLoginAttempts = 0;
      userData.lastLogin = new Date().toISOString();
      updateSecureUserData(matchingKey, userData);
    }

    // ICONTROL_CP_RESTRICTED_ROLES_V1: Vérifier l'accès CP
    if (scope === "CP") {
      const cpAllowedUsers = ["Master", "Developpeur", "WaldHari"];
      if (!cpAllowedUsers.includes(matchingKey)) {
        return { ok: false, error: "Seuls les rôles Master et Developpeur peuvent accéder à l'administration." };
      }
    }

    const session: Session = {
      username: matchingKey,
      role: userData?.role || "MASTER",
      issuedAt: Date.now(),
    };
    setSession(session, scope);
    // Créer une session active pour le session manager
    sessionManager.createSession(matchingKey, {
      ip: (window as any).clientIP || "unknown",
      userAgent: navigator.userAgent
    });
    return { ok: true, session };
  }

  // Authentification pour utilisateurs bootstrap (non sécurisés)
  const hit = BOOTSTRAP_USERS[matchingKey];
  if (!hit) {
    recordFailedAttempt(matchingKey);
    return { ok: false, error: "Erreur: utilisateur trouvé mais données manquantes." };
  }
  
  if (hit.password !== p) {
    recordFailedAttempt(matchingKey);
    // ICONTROL_SECURE_ERROR_MESSAGE_V1: Message générique même en dev pour mot de passe
    return { ok: false, error: "Identifiant ou mot de passe incorrect." };
  }

  // Connexion réussie pour utilisateur bootstrap
  resetRateLimit(matchingKey);

  // ICONTROL_CP_RESTRICTED_ROLES_V1: Restriction CP aux rôles Master, Developpeur et WaldHari
  if (scope === "CP") {
    const cpAllowedUsers = ["Master", "Developpeur", "WaldHari"];
    if (!cpAllowedUsers.includes(matchingKey)) {
      return { ok: false, error: "Seuls les rôles Master et Developpeur peuvent accéder à l'administration." };
    }
  }

  // ICONTROL_MASTER_ROLE_MAPPING_V1: Mapper MASTER à SYSADMIN pour compatibilité interne
  // mais garder la trace que c'est Master via le username
  let sessionRole: Role = hit.role;
  if (matchingKey === "Master" && hit.role === "MASTER") {
    sessionRole = "SYSADMIN" as Role; // Mapper à SYSADMIN pour compatibilité
  }
  
  // ICONTROL_MASTER_ROLE_V1: Master garde son rôle MASTER dans la session
  // mais on le mappe à SYSADMIN pour compatibilité avec le système existant
  let finalRole: Role = sessionRole;
  if (matchingKey === "Master" && hit.role === "MASTER") {
    // Garder MASTER dans la session pour identification, mais utiliser SYSADMIN pour compatibilité
    finalRole = "SYSADMIN" as Role;
  }
  
  // Utiliser le username original (avec la casse de la base de données)
  const session: Session = {
    username: matchingKey,
    role: finalRole,
    issuedAt: Date.now(),
  };
  setSession(session, scope);
  // Créer une session active pour le session manager
  sessionManager.createSession(matchingKey, {
    ip: (window as any).clientIP || "unknown",
    userAgent: navigator.userAgent
  });
  return { ok: true, session };
}

export function logout(scope: AuthScope = resolveAuthScope()): void {
  clearSession(scope);
}

export function requireSession(scope: AuthScope = resolveAuthScope()): Session {
  const s = getSession(scope);
  if (!s) {
    throw new Error("Session requise mais non disponible");
  }
  return s;
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

export async function authenticateManagement(
  username: string,
  password: string,
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
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
