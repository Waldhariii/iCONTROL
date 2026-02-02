import type { EventStore, OutboxRecord, ReplayCursor, TenantId } from "./types";

/**
 * MemoryEventStore — dev/test only
 * Aucun side-effect global; instance locale.
 */
export class MemoryEventStore implements EventStore {
  private rows: OutboxRecord[] = [];

  async append(outbox: OutboxRecord): Promise<void> {
    this.rows.push(outbox);
  }

  async scan(tenantId: TenantId, cursor: ReplayCursor): Promise<OutboxRecord[]> {
    const fromTs = cursor.fromTs ?? 0;
    const toTs = cursor.toTs ?? Number.MAX_SAFE_INTEGER;
    const limit = cursor.limit ?? 500;
    const types = cursor.types && cursor.types.length ? new Set(cursor.types) : null;

    return this.rows
      .filter(r => r.tenantId === tenantId)
      .filter(r => r.ts >= fromTs && r.ts < toTs)
      .filter(r => (types ? types.has(r.type) : true))
      .sort((a, b) => (a.ts === b.ts ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.ts - b.ts))
      .slice(0, limit);
  }

  async prune(tenantId: TenantId, olderThanTs: number): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter(r => !(r.tenantId === tenantId && r.ts < olderThanTs));
    return before - this.rows.length;
  }
}
