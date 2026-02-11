// @ts-nocheck
import type { PlanId } from "./SubscriptionRecord";
import type { Entitlements } from "./Entitlements";
import { ENTITLEMENTS_ENTERPRISE_FREE } from "./Entitlements";

/**
 * Internal plans are stable identifiers.
 * They do NOT encode price. Pricing lives outside (providers).
 */
export const PLANS: Record<PlanId, { id: PlanId; entitlements: Entitlements }> = {
  enterprise_free: {
    id: "enterprise_free",
    entitlements: ENTITLEMENTS_ENTERPRISE_FREE,
  },
  enterprise_standard: {
    id: "enterprise_standard",
    entitlements: {
      ...ENTITLEMENTS_ENTERPRISE_FREE,
      externalSync: true,
    },
  },
  enterprise_plus: {
    id: "enterprise_plus",
    entitlements: {
      ...ENTITLEMENTS_ENTERPRISE_FREE,
      externalSync: true,
      advancedAudit: true,
      dataExport: true,
      unlimitedUsers: true,
    },
  },
};
