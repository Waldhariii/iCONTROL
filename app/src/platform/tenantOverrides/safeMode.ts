/**
 * SAFE_MODE latch for tenant overrides.
 * Purpose: prevent runtime breakage if overrides are invalid or hydrate fails.
 *
 * Contract:
 * - If enabled for a tenant, resolvers must ignore overrides (defaults apply).
 * - Only CP/system can clear it (future: CP action). For now, manual clear helper exists.
 */
const latch = new Map<string, { enabled: true; reason: string; at: string }>();

export function isTenantOverridesSafeMode(tenantId: string): boolean {
  return latch.has(tenantId);
}

export function enableTenantOverridesSafeMode(tenantId: string, reason: string) {
  latch.set(tenantId, { enabled: true, reason, at: new Date().toISOString() });
}

export function clearTenantOverridesSafeMode(tenantId: string) {
  latch.delete(tenantId);
}

export function getTenantOverridesSafeModeState(tenantId: string) {
  return latch.get(tenantId);
}
