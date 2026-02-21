import { getApiBase } from "@/core/runtime/apiBase";
import { normalizeAuthContext } from "@/core/runtime/authContext";
import { increment } from "@/platform/observability/metrics";
import { recordLoginAttempt } from "@/platform/observability/anomalyGuard";

const API_TOKEN_KEY = "icontrol_api_access_token_v1";
const LOGIN_LOCK_KEY = "icontrol_login_lock_v1";
const LOGIN_FAIL_KEY = "icontrol_login_fail_v1";

let inflightLogin: Promise<string> | null = null;

function isDev(): boolean {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true) return true;
    if (typeof window !== "undefined") {
      const h = window.location?.hostname ?? "";
      if (h === "localhost" || h === "127.0.0.1") return true;
    }
  } catch {}
  return false;
}

/* ------------------------------------------
   Cross-tab lock (Safari-safe, localStorage CAS-ish)
------------------------------------------ */
type LoginLock = { id: string; exp: number };
function nowMs(): number { return Date.now(); }
function randId(): string {
  try { return (globalThis.crypto as any)?.randomUUID?.() ?? `${nowMs()}_${Math.random()}`; } catch { return `${nowMs()}_${Math.random()}`; }
}
function readLock(): LoginLock | null {
  try {
    const raw = localStorage.getItem(LOGIN_LOCK_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<LoginLock>;
    if (!v || typeof v.id !== "string" || typeof v.exp !== "number") return null;
    return { id: v.id, exp: v.exp };
  } catch { return null; }
}
function tryWriteLock(lock: LoginLock): boolean {
  try {
    localStorage.setItem(LOGIN_LOCK_KEY, JSON.stringify(lock));
    const reread = readLock();
    return !!reread && reread.id === lock.id;
  } catch { return false; }
}
async function sleep(ms: number): Promise<void> {
  await new Promise(res => setTimeout(res, ms));
}
async function acquireLoginLock(timeoutMs = 6000, ttlMs = 8000): Promise<() => void> {
  const myId = randId();
  const deadline = nowMs() + timeoutMs;
  while (nowMs() < deadline) {
    const cur = readLock();
    if (!cur || cur.exp <= nowMs()) {
      const ok = tryWriteLock({ id: myId, exp: nowMs() + ttlMs });
      if (ok) {
        return () => {
          try {
            const latest = readLock();
            if (latest?.id === myId) localStorage.removeItem(LOGIN_LOCK_KEY);
          } catch {}
        };
      }
    }
    // jitter backoff to avoid thundering herd across tabs
    await sleep(80 + Math.floor(Math.random() * 140));
  }
  // Soft-fail: do not deadlock boot. Let 401 path handle it.
  return () => {};
}

/* ------------------------------------------
   Circuit breaker for login storm
------------------------------------------ */
type FailState = { count: number; firstTs: number; lastTs: number };
function readFailState(): FailState | null {
  try {
    const raw = localStorage.getItem(LOGIN_FAIL_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<FailState>;
    if (!v || typeof v.count !== "number" || typeof v.firstTs !== "number" || typeof v.lastTs !== "number") return null;
    return { count: v.count, firstTs: v.firstTs, lastTs: v.lastTs };
  } catch { return null; }
}
function writeFailState(s: FailState | null): void {
  try {
    if (!s) localStorage.removeItem(LOGIN_FAIL_KEY);
    else localStorage.setItem(LOGIN_FAIL_KEY, JSON.stringify(s));
  } catch {}
}
function bumpFail(): void {
  const t = nowMs();
  const cur = readFailState();
  if (!cur) return writeFailState({ count: 1, firstTs: t, lastTs: t });
  // sliding window behavior: reset if very old
  if (t - cur.lastTs > 2 * 60_000) return writeFailState({ count: 1, firstTs: t, lastTs: t });
  writeFailState({ count: Math.min(50, cur.count + 1), firstTs: cur.firstTs, lastTs: t });
}
function clearFail(): void { writeFailState(null); }
function isCircuitOpen(): boolean {
  const s = readFailState();
  if (!s) return false;
  // Open if >=5 fails within last 60s
  if (s.count >= 5 && (nowMs() - s.lastTs) < 60_000) return true;
  return false;
}

/* ------------------------------------------
   readMgmtSession: DEV seed master/default if no storage
------------------------------------------ */

function getRawRuntime(): false | { tenantId?: string; actorId?: string; role?: string } {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { __ICONTROL_RUNTIME__?: { tenantId?: string; actorId?: string; role?: string } };
  return w.__ICONTROL_RUNTIME__ ?? false;
}

function readMgmtSession(): { username: string; tenantId: string; role: string } {
  try {
    const raw = localStorage.getItem("icontrol_mgmt_session_v1");
    if (raw) {
      const sess = JSON.parse(raw) as { username?: string; user?: string; actorId?: string; tenantId?: string; role?: string };
      const ctx = normalizeAuthContext(getRawRuntime());
      return {
        username: String(sess.username ?? sess.user ?? sess.actorId ?? ctx.actorId),
        tenantId: String(sess.tenantId ?? ctx.tenantId),
        role: String(sess.role ?? ctx.role),
      };
    }
  } catch {}
  if (isDev()) {
    return { username: "master", tenantId: "default", role: "SYSADMIN" };
  }
  return { username: "master", tenantId: "default", role: "SYSADMIN" };
}

/* ------------------------------------------
   Token helpers
------------------------------------------ */

export function getApiAccessToken(): string | null {
  return localStorage.getItem(API_TOKEN_KEY);
}

export function clearApiAccessToken(): void {
  localStorage.removeItem(API_TOKEN_KEY);
}

/* ------------------------------------------
   Ensure API Token (strict mode, uses readMgmtSession)
------------------------------------------ */

export async function ensureApiAccessToken(): Promise<string> {
  const existing = getApiAccessToken();
  if (existing) return existing;

  if (inflightLogin) return inflightLogin;

  inflightLogin = (async () => {
    if (isCircuitOpen()) {
      // stop login storm; let UI show AUTH_REQUIRED once, not infinite loops
      throw new Error("LOGIN_CIRCUIT_OPEN");
    }

    // Cross-tab mutex: only 1 tab performs login at a time (Safari-safe)
    const release = await acquireLoginLock();
    try {
      // Re-check token after lock acquisition (another tab may have set it)
      const after = getApiAccessToken();
      if (after) return after;

      const base = getApiBase();
      const { username, tenantId } = readMgmtSession();

      recordLoginAttempt();
      increment("auth.login.attempt");

      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, tenantId }),
      });

      const txt = await res.text();
      let body: { accessToken?: string; error?: string } | null = null;
      try {
        body = txt ? JSON.parse(txt) : null;
      } catch {}

      if (!res.ok || !body?.accessToken) {
        clearApiAccessToken();
        increment("auth.login.failure");
        if (isDev()) {
          console.warn("[ensureApiAccessToken] LOGIN_FAILED", { status: res.status, body: body ?? txt?.slice(0, 200) });
        }
        bumpFail();
        throw new Error("LOGIN_FAILED");
      }

      localStorage.setItem(API_TOKEN_KEY, body.accessToken);
      clearFail();
      increment("auth.login.success");
      return body.accessToken;
    } finally {
      try { release(); } catch {}
    }
  })();

  try {
    return await inflightLogin;
  } finally {
    inflightLogin = null;
  }
}

export interface SignupData {
  email: string;
  password: string;
  companyName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function signup(data: SignupData) {
  const response = await fetch(`${getApiBase()}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }
  
  return response.json();
}

export async function login(data: LoginData) {
  const response = await fetch(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  return response.json();
}

export function saveToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

export function getAuthHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
