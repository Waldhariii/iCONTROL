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

import type { TenantOverrides } from "../../tenantOverrides/types";
import { writeTenantOverrides } from "../../tenantOverrides/store";
import { hydrateTenantOverrides } from "../../tenantOverrides/hydrate";
import { setTenantOverridesProvenance } from "../../tenantOverrides/provenance";
import { info, ERR } from "../../observability";

/**
 * Control Plane command (no UI yet):
 * - Writes tenant overrides through WriteGateway/VFS
 * - Immediately hydrates cache (deterministic runtime)
 */
export async function cpWriteTenantOverrides(input: {
  tenantId: string;
  overrides: TenantOverrides;
  actorId?: string;
}) {
  try {
    await writeTenantOverrides({
      tenantId: input.tenantId,
      overrides: input.overrides,
      ...(input.actorId ? { actorId: input.actorId } : {}),
    });

    const hyd = await hydrateTenantOverrides({
      tenantId: input.tenantId,
      ...(input.actorId ? { actorId: input.actorId } : {}),
    });

    info("OK", "CP wrote tenant overrides + hydrated", { tenantId: input.tenantId, actorId: input.actorId }, { hydrated: hyd.ok, source: (hyd as any).source });
    setTenantOverridesProvenance({
      tenantId: input.tenantId,
      at: new Date().toISOString(),
      ...(input.actorId ? { actorId: input.actorId } : {}),
      safeMode: { enabled: false },
      overrides: {
        attempted: true,
        applied: true,
        hash: stableHash(stableStringify(input.overrides)),
        updatedAt: (input.overrides as any).updatedAt,
        source: "cp.write",
      },
      decision: "APPLIED",
    });
    return { ok: true as const };
  } catch (e: any) {
    throw new Error(`${ERR.WRITE_GATEWAY_WRITE_FAILED}: ${String(e?.message || e)}`);
  }
}
