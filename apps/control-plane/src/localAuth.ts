import { navigate } from "./runtime/navigate";
import { warn } from "./platform/observability/logger";
import { isEnabled } from "./policies/feature_flags.enforce";
import { createAuditHook } from "./core/write-gateway/auditHook";
import { createLegacyAdapter } from "./core/write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "./core/write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "./core/write-gateway/writeGateway";
import { getLogger } from "./platform/observability/logger";
import { getTenantId } from "./core/runtime/tenant";
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

// WRITE_GATEWAY_LOCALAUTH_COOKIE — shadow scaffold (legacy-first; NO-OP adapter)
const __cookieLogger = getLogger("WRITE_GATEWAY_LOCALAUTH_COOKIE");
let __cookieGateway: ReturnType<typeof createWriteGateway> | null = null;

function __resolveCookieGateway() {
  if (__cookieGateway) return __cookieGateway;
  __cookieGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "localAuthCookieShadowNoop"),
    safeMode: { enabled: true },
  });
  return __cookieGateway;
}

const __isLocalAuthCookieShadowEnabled = (): boolean => {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "localauth_cookie_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.["localauth_cookie_shadow"]?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
};

function setSessionCookie(scope: AuthScope): void {
  const key = getSessionKey(scope);
  const path = getCookiePath(scope);
  let wrote = false;
  let cookie = "";
  try {
    if (typeof document === "undefined") return;
    cookie = `${key}=1; Path=${path}; SameSite=Strict${window.location.protocol === "https:" ? "; Secure" : ""}`;
    document.cookie = cookie;
    wrote = true;
  } catch {
    return;
  }

  // Shadow (NO-OP) — uniquement si flag ON/ROLLOUT
  if (!wrote || !__isLocalAuthCookieShadowEnabled()) return;

  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
  const correlationId = createCorrelationId("localauth_cookie");
  const cmd = {
    kind: "LOCALAUTH_COOKIE_WRITE_SHADOW",
    tenantId,
    correlationId,
    payload: { key, path, bytes: cookie.length, op: "SET" },
    meta: { shadow: true, source: "localAuth.ts" },
  };

  try {
    const res = __resolveCookieGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      __cookieLogger.warn("WRITE_GATEWAY_LOCALAUTH_COOKIE_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    __cookieLogger.warn("WRITE_GATEWAY_LOCALAUTH_COOKIE_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}

function clearSessionCookie(scope: AuthScope): void {
  const key = getSessionKey(scope);
  const path = getCookiePath(scope);
  let wrote = false;
  let cookie = "";
  try {
    if (typeof document === "undefined") return;
    cookie = `${key}=; Path=${path}; Max-Age=0; SameSite=Strict${window.location.protocol === "https:" ? "; Secure" : ""}`;
    document.cookie = cookie;
    wrote = true;
  } catch {
    return;
  }

  // Shadow (NO-OP) — uniquement si flag ON/ROLLOUT
  if (!wrote || !__isLocalAuthCookieShadowEnabled()) return;

  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
  const correlationId = createCorrelationId("localauth_cookie");
  const cmd = {
    kind: "LOCALAUTH_COOKIE_WRITE_SHADOW",
    tenantId,
    correlationId,
    payload: { key, path, bytes: cookie.length, op: "CLEAR" },
    meta: { shadow: true, source: "localAuth.ts" },
  };

  try {
    const res = __resolveCookieGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      __cookieLogger.warn("WRITE_GATEWAY_LOCALAUTH_COOKIE_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    __cookieLogger.warn("WRITE_GATEWAY_LOCALAUTH_COOKIE_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}

function getStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear"> {
  // Canonical storage selector:
  // - Browser: localStorage if available
  // - Non-browser / tests: in-memory storage
  const mem = (() => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
      setItem: (k: string, v: string) => void m.set(k, String(v)),
      removeItem: (k: string) => void m.delete(k),
      clear: () => void m.clear(),
    } satisfies Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear">;
  })();

  try {
    const w = globalThis as any;
    if (typeof w?.window !== "undefined" && w.window?.localStorage) return w.window.localStorage;
  } catch {}

  return mem;
}


export function getSession(
  scope: AuthScope = resolveAuthScope(),
): Session | null {
  // JWT du backend d'abord
  try {
    const token = getStorage().getItem('auth_token');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const currentUser = getStorage().getItem('currentUser');
        return {
          username: currentUser || payload.userId || 'user',
          role: 'ADMIN',
          issuedAt: payload.iat * 1000 || Date.now(),
        };
      }
    }
  } catch {}
  
  // Fallback
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

function normalizeRole(input: unknown): Role | null {
  const r = String(input || "").toUpperCase();
  if (r === "USER" || r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER") return r as Role;
  return null;
}

function coerceUsers(input: unknown): Record<string, { password: string; role: Role }> {
  if (!input) return {};

  // Array form: [{ username, password, role }]
  if (Array.isArray(input)) {
    return input.reduce<Record<string, { password: string; role: Role }>>((acc, u) => {
      const username = typeof (u as any)?.username === "string" ? (u as any).username.trim() : "";
      const password = typeof (u as any)?.password === "string" ? (u as any).password : "";
      const role = normalizeRole((u as any)?.role);
      if (username && password && role) acc[username] = { password, role };
      return acc;
    }, {});
  }

  // Object form: { "user": { password, role }, ... }
  if (typeof input === "object") {
    return Object.entries(input as Record<string, unknown>).reduce<Record<string, { password: string; role: Role }>>(
      (acc, [username, value]) => {
        const v = value as any;
        const password = typeof v?.password === "string" ? v.password : "";
        const role = normalizeRole(v?.role);
        if (username && password && role) acc[username] = { password, role };
        return acc;
      },
      {},
    );
  }

  return {};
}



const FALLBACK_BOOTSTRAP: Record<string, { password: string; role: Role }> = {
  master: { password: "1234", role: "SYSADMIN" },
  admin: { password: "admin", role: "ADMIN" },
  sysadmin: { password: "sysadmin", role: "SYSADMIN" },
  developer: { password: "developer", role: "DEVELOPER" },
};

function loadBootstrapUsers(): Record<string, { password: string; role: Role }> {
  let out: Record<string, { password: string; role: Role }> = {};
  try {
    const w = globalThis as any;
    if (w?.__ICONTROL_BOOTSTRAP_USERS__) {
      out = coerceUsers(w.__ICONTROL_BOOTSTRAP_USERS__);
    }
  } catch {}
  if (Object.keys(out).length > 0) return out;
  try {
    const raw = String((import.meta as any)?.env?.VITE_BOOTSTRAP_USERS || "");
    if (raw) out = coerceUsers(JSON.parse(raw));
  } catch {}
  if (Object.keys(out).length > 0) return out;
  return FALLBACK_BOOTSTRAP;
}

const BOOTSTRAP_USERS = loadBootstrapUsers();

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
      void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: ["WARN_DEV_LOGIN_FAILED", "setSession_failed"] });
      return;
    }
    navigate("#/dashboard");
  };
}

const __isDev =
  typeof import.meta !== "undefined" && Boolean((import.meta as any).env?.DEV);
if (__isDev) registerDevLoginHelper();
