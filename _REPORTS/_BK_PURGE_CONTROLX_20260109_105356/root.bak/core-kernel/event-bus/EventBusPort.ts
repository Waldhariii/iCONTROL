export type EventEnvelope<TPayload = unknown> = {
  type: string;
  payload?: TPayload;
  timestamp: number;
  correlationId?: string;
  meta?: Record<string, unknown>;
};

export type EventHandler<TPayload = unknown> = (event: EventEnvelope<TPayload>) => void;

export type Unsubscribe = () => void;

export interface EventBusPort {
  publish<TPayload = unknown>(event: EventEnvelope<TPayload>): Promise<void>;
  subscribe<TPayload = unknown>(type: string, handler: EventHandler<TPayload>): Unsubscribe;
}
