import type { TenantOverrides } from "./types";

const cache = new Map<string, TenantOverrides>();

export function setTenantOverridesCache(tenantId: string, ov: TenantOverrides) {
  cache.set(tenantId, ov);
}

export function getTenantOverridesCache(tenantId: string): TenantOverrides | undefined {
  return cache.get(tenantId);
}
