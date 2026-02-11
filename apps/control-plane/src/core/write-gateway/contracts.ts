export type IdempotencyKey = string;
export type CorrelationId = string;

export type WriteActor = {
  id?: string;
  type?: string;
};

export type WriteCommand = {
  kind: string;
  tenantId: string;
  actor?: WriteActor;
  correlationId: CorrelationId;
  idempotencyKey?: IdempotencyKey;
  payload: unknown;
  meta?: Record<string, unknown>;
};

export type WriteResultStatus = "OK" | "ERROR" | "SKIPPED";

export type WriteResult = {
  status: WriteResultStatus;
  correlationId: CorrelationId;
  error?: string;
  data?: unknown;
};
