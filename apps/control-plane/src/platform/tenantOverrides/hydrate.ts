function stableHash(input: string): string {
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

import { readTenantOverrides } from "./store";
import { guardTenantOverrides } from "./guard";
import { setTenantOverridesProvenance } from "./provenance";
import { isTenantOverridesSafeMode, getTenantOverridesSafeModeState } from "./safeMode";
import { setTenantOverridesCache } from "./cache";
import { warn, info, WARN } from "../observability";

/**
 * Hydrate tenant overrides into in-memory cache.
 * This keeps resolvers sync while storage remains async.
 *
 * Contract:
 * - Safe to call multiple times; latest wins.
 * - On read failure, cache is not mutated and defaults apply.
 */
export async function hydrateTenantOverrides(input: { tenantId: string; actorId?: string }) {
  if (isTenantOverridesSafeMode(input.tenantId)) {
    const sm = getTenantOverridesSafeModeState(input.tenantId);
    setTenantOverridesProvenance({
      tenantId: input.tenantId,
      at: new Date().toISOString(),
      ...(input.actorId ? { actorId: input.actorId } : {}),
      safeMode: {
        enabled: true,
        persistedEnabled: true,
        ...(sm?.reason ? { reason: sm.reason } : {}),
      },
      overrides: { attempted: false, applied: false },
      decision: "IGNORED_SAFE_MODE",
    });
    return { ok: false as const };
  }

  try {
    const { overrides, meta } = await readTenantOverrides(input.tenantId);
    const guarded = guardTenantOverrides({ tenantId: input.tenantId, overrides, source: meta.source });
    if (!guarded) {
      const raw = stableStringify(overrides);
      setTenantOverridesProvenance({
        tenantId: input.tenantId,
        at: new Date().toISOString(),
        ...(input.actorId ? { actorId: input.actorId } : {}),
        safeMode: { enabled: false },
        overrides: {
          attempted: true,
          applied: false,
          hash: stableHash(raw),
          updatedAt: (overrides as any).updatedAt,
          source: meta.source,
        },
        decision: "REJECTED_GUARD",
      });
      return { ok: false as const };
    }
    setTenantOverridesCache(input.tenantId, guarded);
    const raw = stableStringify(guarded);
    setTenantOverridesProvenance({
      tenantId: input.tenantId,
      at: new Date().toISOString(),
      ...(input.actorId ? { actorId: input.actorId } : {}),
      safeMode: { enabled: false },
      overrides: {
        attempted: true,
        applied: true,
        hash: stableHash(raw),
        updatedAt: (guarded as any).updatedAt,
        source: meta.source,
      },
      decision: "APPLIED",
    });
    info("OK", "Tenant overrides hydrated", { tenantId: input.tenantId, actorId: input.actorId }, { source: meta.source });
    return { ok: true as const, source: meta.source };
  } catch (e: any) {
    // Fail-soft: keep defaults (cache unchanged)
    setTenantOverridesProvenance({
      tenantId: input.tenantId,
      at: new Date().toISOString(),
      ...(input.actorId ? { actorId: input.actorId } : {}),
      safeMode: { enabled: false },
      overrides: { attempted: true, applied: false },
      decision: "FAILED_READ",
      note: String(e?.message || e),
    });
    warn(WARN.FALLBACK_DEFAULT_CONFIG, "Tenant overrides hydrate failed; defaults remain", { tenantId: input.tenantId, actorId: input.actorId }, { err: String(e?.message || e) });
    return { ok: false as const };
  }
}
