import type { EventBus, EventEnvelope, EventStore, EmitResult, ReplayCursor, ReplayResult } from "./types";
import { toOutboxRecord, fromOutboxRecord } from "./outbox";

/**
 * createEventBus — impl V1
 * - emit: validate minimal invariants + append outbox
 * - replay: scan ordered + callback
 */
export function createEventBus(store: EventStore): EventBus {
  return {
    async emit<TPayload>(evt: EventEnvelope<TPayload>): Promise<EmitResult> {
      // Minimal invariants
      if (!evt?.id || !evt?.tenantId || !evt?.type || !evt?.ts) {
        return { accepted: false, stored: false, reason: "ERR_EVENT_INVALID" };
      }
      const rec = toOutboxRecord(evt as EventEnvelope);
      await store.append(rec);
      return { accepted: true, stored: true };
    },

    async replay(
      tenantId: string,
      cursor: ReplayCursor,
      onEvent: (evt: EventEnvelope) => Promise<void> | void
    ): Promise<ReplayResult> {
      const rows = await store.scan(tenantId, cursor);
      for (const r of rows) {
        const evt = fromOutboxRecord(r);
        await onEvent(evt);
      }
      const count = rows.length;
      return { count };
    },
  };
}

export type EventHandler<T=any> = (evt: T) => void;

export type EventName = string;
