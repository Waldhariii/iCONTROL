import { getTenantId } from "../runtime/tenant";
import { loadEntitlements, saveEntitlements } from "./storage";
import type { Entitlements } from "./types";
import { isEnabled } from "../../policies/feature_flags.enforce";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getLogger } from "../utils/logger";

export * from "./types";
export * from "./storage";
export * from "./gates";
export { hasEntitlement, isPageEnabledForTenant } from "./resolve";
export * from "./warnings";
export * from "./requireEntitlement";

// --- Access Guard adapter (non-core) ---
export function getEntitlements(): any {
  // fallback (if no explicit getter found)
  try {
    return (globalThis as any).__ICONTROL_ENTITLEMENTS__ ?? null;
  } catch {
    return null;
  }
}

export function readEntitlements(): Entitlements {
  return loadEntitlements(getTenantId());
}

const logger = getLogger("WRITE_GATEWAY_SHADOW");
let cachedGateway: ReturnType<typeof createWriteGateway> | null = null;

function resolveWriteGateway() {
  if (cachedGateway) return cachedGateway;
  const adapter = createLegacyAdapter((cmd) => {
    const next = cmd.payload as Entitlements;
    saveEntitlements(cmd.tenantId, next);
    return { status: "OK", correlationId: cmd.correlationId };
  }, "legacyEntitlements");

  cachedGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter,
    safeMode: { enabled: true },
  });

  return cachedGateway;
}

function isWriteGatewayShadowEnabled(): boolean {
  try {
    const rt = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "write_gateway_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.write_gateway_shadow?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

export function writeEntitlements(e: Entitlements): void {
  const tenantId = getTenantId();
  if (!isWriteGatewayShadowEnabled()) {
    saveEntitlements(tenantId, e);
    return;
  }

  const cmd = {
    kind: "ENTITLEMENTS_SET",
    tenantId,
    correlationId: createCorrelationId("entitlements"),
    payload: e,
    meta: { shadow: true },
  };

  try {
    const res = resolveWriteGateway().execute(cmd);
    if (res.status !== "OK") {
      logger.warn("WRITE_GATEWAY_SHADOW_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: cmd.correlationId,
        status: res.status,
      });
      saveEntitlements(tenantId, e);
    }
  } catch (err) {
    logger.warn("WRITE_GATEWAY_SHADOW_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: cmd.correlationId,
      error: String(err),
    });
    saveEntitlements(tenantId, e);
  }
}
