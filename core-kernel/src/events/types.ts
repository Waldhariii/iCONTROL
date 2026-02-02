/**
 * Event Backbone V1 — Contract-first
 * Objectif: rendre l'émission, la persistance (outbox) et la relecture (replay) prédictibles,
 * sans dépendance aux surfaces (app/server) et sans side-effects à l'import.
 */

export type EventId = string;
export type TenantId = string;
export type EventType = string;

export type EventEnvelope<TPayload = unknown> = {
  /** Unique, stable, idempotent */
  id: EventId;
  /** Tenant boundary */
  tenantId: TenantId;
  /** Semantic type, ex: "jobs.workOrder.created" */
  type: EventType;
  /** Epoch millis */
  ts: number;
  /** Optional correlation id for cross-cutting traces */
  correlationId?: string;
  /** Optional causation id for lineage */
  causationId?: string;
  /** Append-only payload */
  payload: TPayload;
  /** Version of payload schema for evolution */
  v?: number;
};

export type EmitResult = {
  accepted: boolean;
  stored: boolean;
  reason?: string;
};

export type ReplayCursor = {
  /** inclusive */
  fromTs?: number;
  /** exclusive */
  toTs?: number;
  /** optional type filter */
  types?: string[];
  /** max events */
  limit?: number;
};

export type ReplayResult = {
  count: number;
  nextCursor?: ReplayCursor;
};

export type OutboxRecord = {
  id: EventId;
  tenantId: TenantId;
  type: EventType;
  ts: number;
  correlationId?: string;
  causationId?: string;
  payloadJson: string;
  v?: number;
};

export type EventStore = {
  append(outbox: OutboxRecord): Promise<void>;
  /** Returns records ordered by ts ascending, stable order if same ts by id */
  scan(tenantId: TenantId, cursor: ReplayCursor): Promise<OutboxRecord[]>;
  /** Best-effort pruning policy (retention) */
  prune?(tenantId: TenantId, olderThanTs: number): Promise<number>;
};

export type EventBus = {
  emit<TPayload>(evt: EventEnvelope<TPayload>): Promise<EmitResult>;
  replay(
    tenantId: TenantId,
    cursor: ReplayCursor,
    onEvent: (evt: EventEnvelope) => Promise<void> | void
  ): Promise<ReplayResult>;
};
