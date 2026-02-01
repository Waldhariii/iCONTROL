import type { EntitlementsContext } from "./types";
import { getRuntimeConfigSnapshot } from "../runtimeConfig";
import { getTenantOverridesCache } from "../tenantOverrides/cache";

export function entitlementsContextFromRuntimeConfig(input: {
  tenantId: string;
  role: EntitlementsContext["role"];
}): EntitlementsContext {
  const snap = getRuntimeConfigSnapshot();
  const cfg = snap.config;

  const plan = cfg.tenants?.[input.tenantId];
  const cached = getTenantOverridesCache(input.tenantId);
  const mergedFeatures = { ...(plan?.features || {}), ...(cached?.features || {}) };
  return {
    tenantId: input.tenantId,
    role: input.role,
    tier: (plan?.tier || cfg.defaultTier) as EntitlementsContext["tier"],
    features: mergedFeatures,
  };
}
