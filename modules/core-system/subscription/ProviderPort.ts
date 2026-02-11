// @ts-nocheck
import type { SubscriptionRecord } from "./SubscriptionRecord";

export type ProviderSubscriptionPayload = {
  tenantId: string;
  provider: string; // e.g., "stripe", "paddle", "manual"
  planExternalId: string;
  status: "active" | "inactive";
  currentPeriodEndIso?: string;
  metadata?: Record<string, unknown>;
};

/**
 * ProviderPort: converts external payloads into internal SSOT SubscriptionRecord.
 * Keeps core free from provider SDKs and pricing logic.
 */
export type ProviderPort = {
  toSubscriptionRecord(payload: ProviderSubscriptionPayload): SubscriptionRecord;
};
