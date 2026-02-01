import type { ActorContext, Role } from "./types";
import { entitlementsContextFromRuntimeConfig } from "../entitlements/fromRuntimeConfig";
import { resolveCapabilities } from "../entitlements/resolver";

/**
 * Minimal bootstrap-friendly context builder.
 * For now, actorId is optional and role/tenantId are provided by caller (later: auth).
 */
export function buildActorContext(input: { tenantId: string; role: Role; actorId?: string }): ActorContext {
  const entCtx = entitlementsContextFromRuntimeConfig({ tenantId: input.tenantId, role: input.role });
  const capabilities = resolveCapabilities(entCtx);
  return {
    tenantId: input.tenantId,
    actorId: input.actorId,
    role: input.role,
    capabilities,
  };
}
