import { enableTenantOverridesSafeMode } from "../../tenantOverrides/safeMode";
import { info, ERR } from "../../observability";

/**
 * Control Plane command (no UI yet):
 * Enables tenant overrides SAFE_MODE (persisted) + sets in-memory latch.
 */
export async function cpEnableTenantOverridesSafeMode(input: {
  tenantId: string;
  actorId?: string;
  reason: string;
}) {
  try {
    await enableTenantOverridesSafeMode(input.tenantId, input.reason, input.actorId);
    info("OK", "CP enabled tenant overrides SAFE_MODE", { tenantId: input.tenantId, actorId: input.actorId }, { reason: input.reason });
    return { ok: true as const };
  } catch (e: any) {
    throw new Error(`${ERR.WRITE_GATEWAY_WRITE_FAILED}: ${String(e?.message || e)}`);
  }
}
