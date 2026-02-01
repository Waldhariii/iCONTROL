import type { TenantOverrides } from "./types";
import { enableTenantOverridesSafeMode } from "./safeMode";
import { warn, ERR, WARN } from "../observability";

/**
 * Guard overrides before caching.
 * If guard fails: enable SAFE_MODE and return null (caller must keep defaults).
 */
export function guardTenantOverrides(input: {
  tenantId: string;
  overrides: TenantOverrides;
  source: string;
}): TenantOverrides | null {
  try {
    // Minimal invariants (schema already validated upstream)
    if (input.overrides.schemaVersion !== 1) throw new Error("schemaVersion");
    if (!input.overrides.updatedAt) throw new Error("updatedAt");

    // Hard safety limits (avoid huge payloads)
    const rawSize = JSON.stringify(input.overrides).length;
    if (rawSize > 50_000) throw new Error("payload_too_large");

    return input.overrides;
  } catch (e: any) {
    const reason = `ERR_OVERRIDES_GUARD_FAIL:${String(e?.message || e)}`;
    enableTenantOverridesSafeMode(input.tenantId, reason);
    warn(WARN.FALLBACK_DEFAULT_CONFIG, "Tenant overrides rejected; SAFE_MODE enabled", { tenantId: input.tenantId }, { reason, source: input.source });
    return null;
  }
}
