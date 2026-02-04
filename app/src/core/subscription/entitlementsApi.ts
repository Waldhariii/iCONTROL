import { InMemoryAuditTrail } from "../../../../modules/core-system/subscription/AuditTrail";
import { getSubscriptionService } from "./subscriptionServiceFactory";
import type { SubscriptionService } from "../../../../modules/core-system/subscription/SubscriptionService";

const audit = new InMemoryAuditTrail();

export type EntitlementsReadModel = Awaited<ReturnType<SubscriptionService["resolve"]>>;

export async function getEntitlementsForTenant(tenantId: string, nowIso: string) {
  const svc = await getSubscriptionService();
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
  const svc = await getSubscriptionService();
  const now = nowIso ?? new Date().toISOString();
  const resolved = await svc.resolve(tenantId, now);
  return {
    tenantId,
    nowIso: now,
    effectivePlanId: resolved.effectivePlanId,
    reason: resolved.reason,
    entitlements: resolved.entitlements,
    // optional: include raw subscription record for admin UI if needed
    // FOUNDATION_SHIM: ResolveOutput may not expose subscription in this build
    subscription: ((resolved as any)?.subscription ?? null),

  };
}
