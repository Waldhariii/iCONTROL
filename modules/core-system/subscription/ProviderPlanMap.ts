// @ts-nocheck
import type { PlanId } from "./SubscriptionRecord";

/**
 * Plan mapping is internal configuration.
 * External provider plan IDs map to internal PlanId.
 */
export type ProviderPlanMap = {
  provider: string;
  mapExternalToInternal(externalPlanId: string): PlanId | null;
};

/**
 * Default: no mappings => treat as enterprise_free (safe fallback).
 */
export const DefaultProviderPlanMap: ProviderPlanMap = {
  provider: "default",
  mapExternalToInternal(_externalPlanId: string): PlanId | null {
    return null;
  },
};
