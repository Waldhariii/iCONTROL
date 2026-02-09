import type { RuntimeContext, RuntimeAppKind } from "./types";

/**
 * SSOT runtime context resolver.
 * For now, supports:
 * - global injection: __ICONTROL_TENANT_ID__, __ICONTROL_ACTOR_ID__, __ICONTROL_APP_KIND__, __ICONTROL_PROD__
 * Future: replace with auth/session provider.
 */
export function resolveRuntimeContext(input?: { fallbackTenantId?: string; fallbackAppKind?: RuntimeAppKind }): RuntimeContext {
  const g: any = globalThis as any;

  const tenantId = (g.__ICONTROL_TENANT_ID__ as string | undefined) || input?.fallbackTenantId || "default";
  const actorId = (g.__ICONTROL_ACTOR_ID__ as string | undefined) || undefined;

  const appKindRaw = (g.__ICONTROL_APP_KIND__ as string | undefined) || input?.fallbackAppKind || "APP";
  const appKind: RuntimeAppKind = appKindRaw === "CP" ? "CP" : "APP";

  const isProd = g.__ICONTROL_PROD__ === true;

  return {
    tenantId,
    ...(actorId ? { actorId } : {}),
    appKind,
    isProd,
    source: g.__ICONTROL_TENANT_ID__ ? "global" : "default",
  };
}
