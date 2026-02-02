import { webStorage } from "../../../shared/storage/webStorage";
import { getLogger } from "../../../app/src/core/utils/logger";
import { isEnabled } from "../../../app/src/policies/feature_flags.enforce";
import { createAuditHook } from "../../../app/src/core/write-gateway/auditHook";
import { createLegacyAdapter } from "../../../app/src/core/write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../../../app/src/core/write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../../../app/src/core/write-gateway/writeGateway";
import { getTenantId } from "../../../app/src/core/runtime/tenant";

export type Role = "USER_READONLY" | "ADMIN" | "SYSADMIN" | "DEVELOPER";

export type Session = {
  username: string;
  role: Role;
  fullName?: string;
};

const LS_SESSION = "icontrol_session_v1";
const LS_MGMT = "icontrol_mgmt_session_v1";

type BootstrapUser = { username: string; password: string; role: Role; fullName?: string };

/** WRITE_GATEWAY_LOCALAUTH — shadow scaffold (legacy-first; NO-OP adapter). */
const __localAuthLogger = getLogger("WRITE_GATEWAY_LOCALAUTH");
let __localAuthGateway: ReturnType<typeof createWriteGateway> | null = null;

function __resolveLocalAuthGateway() {
  if (__localAuthGateway) return __localAuthGateway;
  __localAuthGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "localAuthShadowNoop"),
    safeMode: { enabled: true },
  });
  return __localAuthGateway;
}

const __isLocalAuthShadowEnabled = (): boolean => {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "localauth_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.["localauth_shadow"]?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
};

function normalizeRole(input: unknown): Role | null {
  const r = String(input || "").toUpperCase();
  if (r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER" || r === "USER_READONLY") return r as Role;
  return null;
}

function coerceUsers(input: unknown): BootstrapUser[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((u) => {
        const username = typeof u?.username === "string" ? u.username.trim() : "";
        const password = typeof u?.password === "string" ? u.password : "";
        const role = normalizeRole(u?.role);
        const fullName = typeof u?.fullName === "string" ? u.fullName : undefined;
        if (!username || !password || !role) return null;
        return { username, password, role, fullName };
      })
      .filter(Boolean) as BootstrapUser[];
  }
  if (typeof input === "object") {
    return Object.entries(input as Record<string, unknown>)
      .map(([username, value]) => {
        const password = typeof (value as any)?.password === "string" ? (value as any).password : "";
        const role = normalizeRole((value as any)?.role);
        const fullName = typeof (value as any)?.fullName === "string" ? (value as any).fullName : undefined;
        if (!username || !password || !role) return null;
        return { username: username.trim(), password, role, fullName };
      })
      .filter(Boolean) as BootstrapUser[];
  }
  return [];
}

const FALLBACK_BOOTSTRAP: BootstrapUser[] = [
  { username: "master", password: "1234", role: "SYSADMIN" },
  { username: "admin", password: "admin", role: "ADMIN" },
  { username: "sysadmin", password: "sysadmin", role: "SYSADMIN" },
  { username: "developer", password: "developer", role: "DEVELOPER" },
];

function loadBootstrapUsers(): BootstrapUser[] {
  let out: BootstrapUser[] = [];
  try {
    const w = globalThis as any;
    if (w?.__ICONTROL_BOOTSTRAP_USERS__) {
      out = coerceUsers(w.__ICONTROL_BOOTSTRAP_USERS__);
    }
  } catch {}
  if (out.length > 0) return out;
  try {
    const anyImportMeta = import.meta as any;
    const raw = String(anyImportMeta?.env?.VITE_BOOTSTRAP_USERS || "");
    if (raw) out = coerceUsers(JSON.parse(raw));
  } catch {}
  if (out.length > 0) return out;
  return FALLBACK_BOOTSTRAP;
}

const BOOTSTRAP_USERS = loadBootstrapUsers();

export function authenticate(username: string, password: string): Session | null {
  const u = BOOTSTRAP_USERS.find(x => x.username === username && x.password === password);
  if (!u) return null;
  const s: Session = { username: u.username, role: u.role, fullName: u.fullName };
  const serialized = JSON.stringify(s);
  let wrote = false;
  try {
    webStorage.set(LS_SESSION, serialized);
    wrote = true;
  } catch (_) {}

  if (wrote && __isLocalAuthShadowEnabled()) {
    const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
    const correlationId = createCorrelationId("localauth");
    const cmd = {
      kind: "LOCALAUTH_WRITE_SHADOW",
      tenantId,
      correlationId,
      payload: { key: LS_SESSION, bytes: serialized.length },
      meta: { shadow: true, source: "localAuth.ts" },
    };

    try {
      const res = __resolveLocalAuthGateway().execute(cmd as any);
      if (res.status !== "OK" && res.status !== "SKIPPED") {
        __localAuthLogger.warn("WRITE_GATEWAY_LOCALAUTH_FALLBACK", {
          kind: cmd.kind,
          tenant_id: tenantId,
          correlation_id: correlationId,
          status: res.status,
        });
      }
    } catch (err) {
      __localAuthLogger.warn("WRITE_GATEWAY_LOCALAUTH_ERROR", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        error: String(err),
      });
    }
  }
  return s;
}

export function getSession(): Session | null {
  try {
    const raw = webStorage.get(LS_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch (_) {
    return null;
  }
}

export function logout(): void {
  try { webStorage.del(LS_SESSION); } catch (_) {}
}

export function requireSession(): Session {
  const s = getSession();
  if (!s) throw new Error("NO_SESSION");
  return s;
}

/** Management (CP) session — separate storage key. */
export function authenticateManagement(username: string, password: string): Session | null {
  const u = BOOTSTRAP_USERS.find(x => x.username === username && x.password === password);
  if (!u) return null;
  const s: Session = { username: u.username, role: u.role, fullName: u.fullName };
  try {
    webStorage.set(LS_MGMT, JSON.stringify(s));
  } catch (_) {}
  return s;
}

export function getManagementSession(): Session | null {
  try {
    const raw = webStorage.get(LS_MGMT);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch (_) {
    return null;
  }
}

export function clearManagementSession(): void {
  try {
    webStorage.del(LS_MGMT);
  } catch (_) {}
}
