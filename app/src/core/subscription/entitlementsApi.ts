import { InMemoryAuditTrail } from "../../../../modules/core-system/subscription/AuditTrail";
import { SubscriptionService } from "../../../../modules/core-system/subscription/SubscriptionService";
import { createSubscriptionService } from "./subscriptionServiceFactory";

const store = /*removed*/ null;
const audit = new InMemoryAuditTrail();
const svc = new SubscriptionService({ store, audit });

export type EntitlementsReadModel = Awaited<ReturnType<typeof svc.resolve>>;

export async function getEntitlementsForTenant(tenantId: string, nowIso: string) {
  const svc = createSubscriptionService();
  const out = await svc.resolve(tenantId, nowIso);
  return out;
}

export function getEntitlementsAuditSnapshot() {
  return audit.snapshot();
}


/**
 * Read-model diagnostics for UI (enterprise-grade support).
 * Returns: effectivePlanId, source, reason, and entitlements.
 */
export async function getEntitlementsDiagnosticsForTenant(tenantId: string, nowIso?: string) {
  const svc = createSubscriptionService();
  const now = nowIso ?? new Date().toISOString();
  const resolved = await svc.resolve(tenantId, now);
  return {
    tenantId,
    nowIso: now,
    effectivePlanId: resolved.effectivePlanId,
    reason: resolved.reason,
    entitlements: resolved.entitlements,
    // optional: include raw subscription record for admin UI if needed
    subscription: resolved.subscription ?? null,
  };
}
