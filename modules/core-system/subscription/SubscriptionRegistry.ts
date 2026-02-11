// @ts-nocheck
import type { SubscriptionRecord } from "./SubscriptionRecord";
import type { SubscriptionStore } from "./SubscriptionStore";

/**
 * Internal Subscription Registry (write-model) — enterprise baseline.
 * - Provider-agnostic
 * - Used by Admin UI / automation / ops
 * - Keeps system running even when no provider exists
 */
export class SubscriptionRegistry {
  constructor(private readonly store: SubscriptionStore) {}

  async setActivePlan(input: {
    tenantId: string;
    planId: SubscriptionRecord["planId"];
    startedAt: string;     // ISO
    expiresAt?: string;    // ISO
  }): Promise<void> {
    const rec: SubscriptionRecord = {
      tenantId: input.tenantId,
      planId: input.planId,
      status: "active",
      source: "internal",
      startedAt: input.startedAt,
      expiresAt: input.expiresAt,
    };
    await this.store.upsert(rec);
  }

  async cancel(input: { tenantId: string; canceledAt: string }): Promise<void> {
    const current = await this.store.getByTenantId(input.tenantId);
    const rec: SubscriptionRecord = {
      tenantId: input.tenantId,
      planId: current?.planId ?? "enterprise_free",
      status: "canceled",
      source: "internal",
      startedAt: current?.startedAt ?? input.canceledAt,
      expiresAt: input.canceledAt,
    };
    await this.store.upsert(rec);
  }
}
