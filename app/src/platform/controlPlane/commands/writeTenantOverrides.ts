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
      actorId: input.actorId,
    });

    const hyd = await hydrateTenantOverrides({ tenantId: input.tenantId, actorId: input.actorId });

    info("OK", "CP wrote tenant overrides + hydrated", { tenantId: input.tenantId, actorId: input.actorId }, { hydrated: hyd.ok, source: (hyd as any).source });
    setTenantOverridesProvenance({
      tenantId: input.tenantId,
      at: new Date().toISOString(),
      actorId: input.actorId,
      safeMode: { enabled: false },
      overrides: {
        attempted: true,
        applied: true,
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
