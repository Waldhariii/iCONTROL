import type { SubscriptionStore } from "./SubscriptionStore";
import type { AuditTrail } from "./AuditTrail";
import { resolveEntitlements } from "./SubscriptionResolver";
import type { EntitlementKey } from "./Policy";
import { canUseEntitlement, requireEntitlement } from "./Policy";

export type SubscriptionServiceDeps = {
  store: SubscriptionStore;
  audit: AuditTrail;
};

export class SubscriptionService {
  private store: SubscriptionStore;
  private audit: AuditTrail;

  constructor(deps: SubscriptionServiceDeps) {
    this.store = deps.store;
    this.audit = deps.audit;
  }

  async resolve(tenantId: string, nowIso?: string) {
    const sub = await this.store.getByTenantId(tenantId);
    const out = resolveEntitlements({ tenantId, subscription: sub, nowIso });
    this.audit.record({ type: "subscription_resolved", atIso: nowIso ?? new Date().toISOString(), payload: out });
    return out;
  }

  async canUse(tenantId: string, key: EntitlementKey, nowIso?: string) {
    const out = await this.resolve(tenantId, nowIso);
    return canUseEntitlement(tenantId, out.entitlements, key);
  }

  async require(tenantId: string, key: EntitlementKey, nowIso?: string) {
    const out = await this.resolve(tenantId, nowIso);
    requireEntitlement(tenantId, out.entitlements, key);
  }
}
