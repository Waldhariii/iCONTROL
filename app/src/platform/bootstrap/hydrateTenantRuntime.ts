import type { RuntimeContext } from "../runtimeContext/types";
import { hydrateTenantOverridesSafeMode } from "../tenantOverrides/safeMode";
import { hydrateTenantOverrides } from "../tenantOverrides/hydrate";
import { info } from "../observability";

/**
 * Canonical tenant runtime hydration order:
 * 1) SAFE_MODE (persisted) hydrate
 * 2) overrides hydrate (guarded; respects safe mode)
 */
export async function hydrateTenantRuntime(ctx: RuntimeContext) {
  const sm = await hydrateTenantOverridesSafeMode({ tenantId: ctx.tenantId });
  const ov = await hydrateTenantOverrides({
    tenantId: ctx.tenantId,
    ...(ctx.actorId ? { actorId: ctx.actorId } : {}),
  });

  info("OK", "Tenant runtime hydrated", { tenantId: ctx.tenantId, actorId: ctx.actorId }, { safeModeEnabled: sm.enabled, overridesHydrated: ov.ok });
  return { safeModeEnabled: sm.enabled, overridesHydrated: ov.ok };
}
