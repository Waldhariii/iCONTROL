import type { TenantOverrides } from "./types";
import { cpEnableTenantOverridesSafeMode } from "../controlPlane/commands/enableTenantOverridesSafeMode";
import { warn, WARN } from "../observability";

/**
 * Guard overrides before caching.
 * If guard fails: enable SAFE_MODE (best-effort) and return null (caller keeps defaults).
 *
 * NOTE: cpEnableTenantOverridesSafeMode is async (persisted). We intentionally do not await here
 * to keep resolver/hydrator control flow simple; persistence is best-effort.
 */
export function guardTenantOverrides(input: {
  tenantId: string;
  overrides: TenantOverrides;
  source: string;
}): TenantOverrides | null {
  try {
    if (input.overrides.schemaVersion !== 1) throw new Error("schemaVersion");
    if (!input.overrides.updatedAt) throw new Error("updatedAt");

    const rawSize = JSON.stringify(input.overrides).length;
    if (rawSize > 50_000) throw new Error("payload_too_large");

    return input.overrides;
  } catch (e: any) {
    const reason = `ERR_OVERRIDES_GUARD_FAIL:${String(e?.message || e)}`;
    void cpEnableTenantOverridesSafeMode({ tenantId: input.tenantId, actorId: undefined, reason });
    warn(WARN.FALLBACK_DEFAULT_CONFIG, "Tenant overrides rejected; SAFE_MODE enabled", { tenantId: input.tenantId }, { reason, source: input.source });
    return null;
  }
}
