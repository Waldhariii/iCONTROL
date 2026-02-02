export type EventName = string;
export type EventPayload = Record<string, unknown>;

export interface EventEnvelope {
  name: EventName;
  ts: string; // ISO
  correlationId?: string;
  tenantId?: string;
  payload: EventPayload;
}

export type EventHandler = (evt: EventEnvelope) => void | Promise<void>;

export interface EventBus {
  publish(evt: EventEnvelope): void;
  subscribe(name: EventName, handler: EventHandler): () => void;
}
