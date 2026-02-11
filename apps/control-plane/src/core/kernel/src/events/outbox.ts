import type { EventEnvelope, OutboxRecord } from "./types";

/** Serialize to OutboxRecord (append-only) */
export function toOutboxRecord(evt: EventEnvelope): OutboxRecord {
  const out: OutboxRecord = {
    id: evt.id,
    tenantId: evt.tenantId,
    type: evt.type,
    ts: evt.ts,
    payloadJson: JSON.stringify(evt.payload ?? null),
  };
  if (evt.correlationId !== undefined) out.correlationId = evt.correlationId;
  if (evt.causationId !== undefined) out.causationId = evt.causationId;
  if (evt.v !== undefined) out.v = evt.v;
  return out;
}

/** Deserialize OutboxRecord -> EventEnvelope */
export function fromOutboxRecord(rec: OutboxRecord): EventEnvelope {
  const out: EventEnvelope = {
    id: rec.id,
    tenantId: rec.tenantId,
    type: rec.type,
    ts: rec.ts,
    payload: JSON.parse(rec.payloadJson ?? "null"),
  };
  if (rec.correlationId !== undefined) out.correlationId = rec.correlationId;
  if (rec.causationId !== undefined) out.causationId = rec.causationId;
  if (rec.v !== undefined) out.v = rec.v;
  return out;
}
