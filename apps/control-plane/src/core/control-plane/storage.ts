import { webStorage } from "../../platform/storage/webStorage";
import { isEnabled } from "../../policies/feature_flags.enforce";
import { getTenantId } from "../runtime/tenant";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getLogger } from "../utils/logger";

/** LocalStorageProvider — stub pour résolution de build (tenants, audit). */
const logger = getLogger("WRITE_GATEWAY_CP_STORAGE");
let cachedGateway: ReturnType<typeof createWriteGateway> | null = null;

function resolveStorageGateway() {
  if (cachedGateway) return cachedGateway;
  cachedGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "cpStorageShadowNoop"),
    safeMode: { enabled: true },
  });
  return cachedGateway;
}

function isStorageShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "cp_storage_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.cp_storage_shadow?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}
export class LocalStorageProvider {
  constructor(public readonly prefix: string) {}
  getItem(key: string): string | null {
    try {
      return webStorage.get(this.prefix + key);
    } catch {
      return null;
    }
  }
  setItem(key: string, value: string): void {
    const fullKey = this.prefix + key;
    try {
      webStorage.set(fullKey, value);
    } catch {
      return;
    }

    if (!isStorageShadowEnabled()) return;

    const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") as string;
    const correlationId = createCorrelationId("cp_storage");
    const cmd = {
      kind: "CP_STORAGE_SET",
      tenantId,
      correlationId,
      payload: { key: fullKey, bytes: value?.length || 0 },
      meta: { shadow: true, source: "LocalStorageProvider.setItem" },
    };

    try {
      const res = resolveStorageGateway().execute(cmd as any);
      if (res.status !== "OK" && res.status !== "SKIPPED") {
        logger.warn("WRITE_GATEWAY_CP_STORAGE_FALLBACK", {
          kind: cmd.kind,
          tenant_id: tenantId,
          correlation_id: correlationId,
          status: res.status,
        });
      }
    } catch (err) {
      logger.warn("WRITE_GATEWAY_CP_STORAGE_ERROR", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        error: String(err),
      });
    }
  }
}
