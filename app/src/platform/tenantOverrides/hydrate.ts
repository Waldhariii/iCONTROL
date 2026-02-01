import { readTenantOverrides } from "./store";
import { setTenantOverridesCache } from "./cache";
import { warn, info, ERR, WARN } from "../observability";

/**
 * Hydrate tenant overrides into in-memory cache.
 * This keeps resolvers sync while storage remains async.
 *
 * Contract:
 * - Safe to call multiple times; latest wins.
 * - On read failure, cache is not mutated and defaults apply.
 */
export async function hydrateTenantOverrides(input: { tenantId: string; actorId?: string }) {
  try {
    const { overrides, meta } = await readTenantOverrides(input.tenantId);
    setTenantOverridesCache(input.tenantId, overrides);
    info("OK", "Tenant overrides hydrated", { tenantId: input.tenantId, actorId: input.actorId }, { source: meta.source, schemaVersion: overrides.schemaVersion });
    return { ok: true as const, source: meta.source };
  } catch (e: any) {
    // Fail-soft: keep defaults (cache unchanged)
    warn(WARN.FALLBACK_DEFAULT_CONFIG, "Tenant overrides hydrate failed; defaults remain", { tenantId: input.tenantId, actorId: input.actorId }, { err: String(e?.message || e) });
    return { ok: false as const };
  }
}
