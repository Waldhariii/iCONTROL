/**
 * SAFE_MODE (v1)
 * - When enabled, write operations to storage should be blocked
 * - Signal sources:
 *   1) window.__ICONTROL_SAFE_MODE__ (runtime override)
 *   2) localStorage flag "icontrol.runtime.safeMode.v1"
 */
import { webStorage } from "../../platform/storage/webStorage";
import { isEnabled } from "../../policies/feature_flags.enforce";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getLogger } from "../utils/logger";
import { getTenantId } from "./tenant";

const SAFE_KEY = "icontrol.runtime.safeMode.v1";

/** WRITE_GATEWAY_SAFEMODE — shadow scaffold (legacy-first; NO-OP adapter). */
const __wsLogger = getLogger("WRITE_GATEWAY_SAFEMODE");
let __wsGateway: ReturnType<typeof createWriteGateway> | null = null;

function __resolveWsGateway() {
  if (__wsGateway) return __wsGateway;
  __wsGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "safeModeShadowNoop"),
    safeMode: { enabled: true },
  });
  return __wsGateway;
}

function __isWsShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "safemode_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.["safemode_shadow"]?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

export function isSafeMode(): boolean {
  try {
    const w: any = window as any;
    if (typeof w.__ICONTROL_SAFE_MODE__ === "boolean") return w.__ICONTROL_SAFE_MODE__;
    const v = webStorage.get(SAFE_KEY);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

/** Dev-only helper */
export function setSafeMode(on: boolean): void {
  if (typeof window === "undefined") return;
  const value = on ? "1" : "0";

  // Legacy-first write (OK même si erreur)
  let wrote = false;
  try {
    webStorage.set(SAFE_KEY, value);
    wrote = true;
  } catch {
    return;
  }

  // Shadow (NO-OP) — uniquement si flag ON/ROLLOUT
  // (ne doit jamais réécrire SAFE_KEY; adapter doit retourner SKIPPED)
  if (!wrote || !__isWsShadowEnabled()) return;

  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
  const correlationId = createCorrelationId("safeMode");
  const cmd = {
    kind: "SAFEMODE_WRITE_SHADOW",
    tenantId,
    correlationId,
    payload: { key: SAFE_KEY, bytes: value.length },
    meta: { shadow: true, source: "safeMode.ts" },
  };

  try {
    const res = __resolveWsGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      __wsLogger.warn("WRITE_GATEWAY_SAFEMODE_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    __wsLogger.warn("WRITE_GATEWAY_SAFEMODE_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}
