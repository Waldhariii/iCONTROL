/**
 * Tenant Context (v1)
 * - Default: "public" (single-tenant fallback)
 * - Future: derive from auth/session/hostname/route param
 */
import { webStorage } from "../../platform/storage/webStorage";
import { isEnabled } from "../../policies/feature_flags.enforce";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getLogger } from "../utils/logger";

const TENANT_KEY = "icontrol.runtime.tenantId.v1";
const logger = getLogger("WRITE_GATEWAY_TENANT");
let tenantGateway: ReturnType<typeof createWriteGateway> | null = null;

function resolveTenantGateway() {
  if (tenantGateway) return tenantGateway;
  tenantGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "tenantShadowNoop"),
    safeMode: { enabled: true },
  });
  return tenantGateway;
}

function isTenantShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "tenant_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.tenant_shadow?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

export function getTenantId(): string {
  try {
    const v = webStorage.get(TENANT_KEY);
    return (v && v.trim()) ? v.trim() : "public";
  } catch {
    return "public";
  }
}

/** Dev-only helper: allows manual switching in local/dev. */
export function setTenantId(id: string) {
  const v = (id || "").trim() || "public";
  webStorage.set(TENANT_KEY, v);

  if (!isTenantShadowEnabled()) return;

  const correlationId = createCorrelationId("tenant");
  const cmd = {
    kind: "TENANT_SET",
    tenantId: v,
    correlationId,
    payload: { tenantId: v },
    meta: { shadow: true, source: "runtime.tenant", key: TENANT_KEY },
  };

  try {
    const res = resolveTenantGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      logger.warn("WRITE_GATEWAY_TENANT_FALLBACK", {
        kind: cmd.kind,
        tenant_id: v,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    logger.warn("WRITE_GATEWAY_TENANT_ERROR", {
      kind: cmd.kind,
      tenant_id: v,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}
