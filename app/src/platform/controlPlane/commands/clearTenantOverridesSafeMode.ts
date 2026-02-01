import { clearTenantOverridesSafeMode } from "../../tenantOverrides/safeMode";
import { info, ERR } from "../../observability";

/**
 * Control Plane command (no UI yet):
 * Clears tenant overrides SAFE_MODE (persisted) + removes in-memory latch.
 */
export async function cpClearTenantOverridesSafeMode(input: {
  tenantId: string;
  actorId?: string;
  reason?: string;
}) {
  try {
    await clearTenantOverridesSafeMode(input.tenantId, input.actorId);
    info("OK", "CP cleared tenant overrides SAFE_MODE", { tenantId: input.tenantId, actorId: input.actorId }, { reason: input.reason || "manual_clear" });
    return { ok: true as const };
  } catch (e: any) {
    throw new Error(`${ERR.WRITE_GATEWAY_WRITE_FAILED}: ${String(e?.message || e)}`);
  }
}
