// @ts-nocheck
import type { ProviderPort, ProviderSubscriptionPayload } from "./ProviderPort";
import type { SubscriptionRecord, PlanId } from "./SubscriptionRecord";
import type { ProviderPlanMap } from "./ProviderPlanMap";
import { DefaultProviderPlanMap } from "./ProviderPlanMap";

/**
 * DefaultProviderPort:
 * - If external plan ID unknown => enterprise_free (safe)
 * - If inactive => suspended (free fallback applies)
 */
export class DefaultProviderPort implements ProviderPort {
  private planMap: ProviderPlanMap;

  constructor(planMap: ProviderPlanMap = DefaultProviderPlanMap) {
    this.planMap = planMap;
  }

  toSubscriptionRecord(payload: ProviderSubscriptionPayload): SubscriptionRecord {
    const mapped: PlanId | null = this.planMap.mapExternalToInternal(payload.planExternalId);

    return {
      tenantId: payload.tenantId,
      planId: mapped ?? "enterprise_free",
      status: payload.status === "active" ? "active" : "suspended",
      source: payload.provider as any,
      startedAt: new Date().toISOString(),
      expiresAt: payload.currentPeriodEndIso,
      metadata: payload.metadata ?? {},
    };
  }
}
