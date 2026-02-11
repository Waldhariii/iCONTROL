// @ts-nocheck
export type SubscriptionStatus = "active" | "suspended" | "expired";

export type SubscriptionSource = "internal" | "manual" | "import" | "stripe" | "paddle";

export type PlanId =
  | "enterprise_free"
  | "enterprise_standard"
  | "enterprise_plus";

/**
 * SSOT: SubscriptionRecord
 * - No pricing knowledge
 * - No provider dependency
 * - No UI dependency
 * - Must work offline
 */
export type SubscriptionRecord = {
  tenantId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  startedAt: string;   // ISO8601
  expiresAt?: string;  // ISO8601 | undefined (undefined = unlimited for free/default)
  metadata?: Record<string, unknown>;
};
