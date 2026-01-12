import type { SubscriptionRecord, PlanId } from "./SubscriptionRecord";
import type { Entitlements } from "./Entitlements";
import { PLANS } from "./Plans";

export type ResolveInput = {
  tenantId: string;
  nowIso?: string; // ISO8601; optional for deterministic tests
  subscription?: SubscriptionRecord | null;
};

export type ResolveOutput = {
  tenantId: string;
  effectivePlanId: PlanId;
  entitlements: Entitlements;
  reason: "explicit" | "missing_fallback_free" | "expired_fallback_free" | "inactive_fallback_free";
};

function isExpired(sub: SubscriptionRecord, nowIso: string): boolean {
  if (!sub.expiresAt) return false;
  return new Date(sub.expiresAt).getTime() <= new Date(nowIso).getTime();
}

/**
 * SSOT resolver:
 * - If subscription missing => enterprise_free
 * - If inactive/expired => enterprise_free
 * - Always returns entitlements (business-facing)
 */
export function resolveEntitlements(input: ResolveInput): ResolveOutput {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const sub = input.subscription ?? null;

  if (!sub) {
    return {
      tenantId: input.tenantId,
      effectivePlanId: "enterprise_free",
      entitlements: PLANS.enterprise_free.entitlements,
      reason: "missing_fallback_free",
    };
  }

  const statusOk = sub.status === "active";
  const expired = isExpired(sub, nowIso);

  if (!statusOk) {
    return {
      tenantId: input.tenantId,
      effectivePlanId: "enterprise_free",
      entitlements: PLANS.enterprise_free.entitlements,
      reason: "inactive_fallback_free",
    };
  }

  if (expired) {
    return {
      tenantId: input.tenantId,
      effectivePlanId: "enterprise_free",
      entitlements: PLANS.enterprise_free.entitlements,
      reason: "expired_fallback_free",
    };
  }

  const plan = PLANS[sub.planId] ?? PLANS.enterprise_free;

  return {
    tenantId: input.tenantId,
    effectivePlanId: plan.id,
    entitlements: plan.entitlements,
    reason: "explicit",
  };
}
