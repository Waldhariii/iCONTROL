import type { EventEnvelope, OutboxRecord } from "./types";

/** Serialize to OutboxRecord (append-only) */
export function toOutboxRecord(evt: EventEnvelope): OutboxRecord {
  return {
    id: evt.id,
    tenantId: evt.tenantId,
    type: evt.type,
    ts: evt.ts,
    correlationId: evt.correlationId,
    causationId: evt.causationId,
    payloadJson: JSON.stringify(evt.payload ?? null),
    v: evt.v,
  };
}

/** Deserialize OutboxRecord -> EventEnvelope */
export function fromOutboxRecord(rec: OutboxRecord): EventEnvelope {
  return {
    id: rec.id,
    tenantId: rec.tenantId,
    type: rec.type,
    ts: rec.ts,
    correlationId: rec.correlationId,
    causationId: rec.causationId,
    payload: JSON.parse(rec.payloadJson ?? "null"),
    v: rec.v,
  };
}
