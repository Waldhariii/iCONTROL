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

function stableStringify(value: any): string {
  const seen = new WeakSet<object>();
  const norm = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(norm);
    if (seen.has(v)) return "[Circular]";
    seen.add(v);
    const out: any = {};
    for (const k of Object.keys(v).sort()) out[k] = norm(v[k]);
    return out;
  };
  return JSON.stringify(norm(value));
}

export type TenantRuntimeSnapshot = {
  tenantId: string;
  warnings: string[];
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
  const warnings: string[] = [];
  const enabled = isTenantOverridesSafeMode(tenantId);
  const mem = getTenantOverridesSafeModeState(tenantId);

  let persisted: any;
  try {
    persisted = await readTenantSafeMode(tenantId);
  } catch {
    persisted = { enabled: false, reason: "ERR_SAFE_MODE_READ_FAILED" };
    warnings.push("WARN_SAFE_MODE_READ_FAILED");
  }

  if (enabled && !persisted.enabled) warnings.push("WARN_SAFE_MODE_MEM_ONLY");
  if (!enabled && persisted.enabled) warnings.push("WARN_SAFE_MODE_PERSISTED_ONLY");

  const cached = getTenantOverridesCache(tenantId);
  const presentInCache = !!cached;

  if (enabled) warnings.push("WARN_OVERRIDES_HIDDEN_BY_SAFE_MODE");

  const json = cached ? stableStringify(cached) : "";
  const hash = cached ? stableHash(json) : undefined;

  return {
    tenantId,
    warnings,
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
