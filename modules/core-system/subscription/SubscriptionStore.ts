import type { SubscriptionRecord } from "./SubscriptionRecord";

export type SubscriptionStore = {
  getByTenantId(tenantId: string): Promise<SubscriptionRecord | null>;
  upsert(record: SubscriptionRecord): Promise<void>;
};

/**
 * Default store: in-memory (enterprise-free capable, offline).
 * In production you can implement a DB-backed store without changing core API.
 */
export class InMemorySubscriptionStore implements SubscriptionStore {
  private map = new Map<string, SubscriptionRecord>();

  async getByTenantId(tenantId: string): Promise<SubscriptionRecord | null> {
    return this.map.get(tenantId) ?? null;
  }

  async upsert(record: SubscriptionRecord): Promise<void> {
    this.map.set(record.tenantId, record);
  }
}
