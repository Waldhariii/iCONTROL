import type { TenantOverrides } from "./types";

import { isTenantOverridesSafeMode } from "./safeMode";

const cache = new Map<string, TenantOverrides>();

export function setTenantOverridesCache(tenantId: string, ov: TenantOverrides) {
  cache.set(tenantId, ov);
}

export function getTenantOverridesCache(tenantId: string): TenantOverrides | undefined {
  if (isTenantOverridesSafeMode(tenantId)) return undefined;
  return cache.get(tenantId);
}
