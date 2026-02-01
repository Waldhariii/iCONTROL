import { getTenantOverridesSafeModeState, isTenantOverridesSafeMode } from "../../tenantOverrides/safeMode";
import { readTenantSafeMode } from "../../tenantOverrides/safeModeStore";
import { getTenantOverridesCache } from "../../tenantOverrides/cache";

function stableHash(input: string): string {
  // lightweight, deterministic hash (no crypto import)
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export type TenantRuntimeSnapshot = {
  tenantId: string;
  safeMode: {
    enabled: boolean;
    mem?: { reason: string; at: string };
    persisted: { enabled: boolean; reason?: string; at?: string; updatedBy?: string };
  };
  overrides: {
    applied: boolean;
    presentInCache: boolean;
    hash?: string;
  };
};

/**
 * Read-only diagnostic snapshot for CP.
 * Must never throw (fail-soft) — returns best-effort data.
 */
export async function cpTenantRuntimeSnapshot(tenantId: string): Promise<TenantRuntimeSnapshot> {
  const enabled = isTenantOverridesSafeMode(tenantId);
  const mem = getTenantOverridesSafeModeState(tenantId);

  let persisted = { enabled: false as boolean } as any;
  try {
    persisted = await readTenantSafeMode(tenantId);
  } catch {
    persisted = { enabled: false, reason: "ERR_SAFE_MODE_READ_FAILED" };
  }

  const cached = getTenantOverridesCache(tenantId);
  const presentInCache = !!cached;

  const json = cached ? JSON.stringify(cached) : "";
  const hash = cached ? stableHash(json) : undefined;

  return {
    tenantId,
    safeMode: {
      enabled,
      mem: mem ? { reason: mem.reason, at: mem.at } : undefined,
      persisted: {
        enabled: !!persisted.enabled,
        reason: persisted.reason,
        at: persisted.at,
        updatedBy: persisted.updatedBy,
      },
    },
    overrides: {
      applied: !enabled && presentInCache,
      presentInCache,
      hash,
    },
  };
}
