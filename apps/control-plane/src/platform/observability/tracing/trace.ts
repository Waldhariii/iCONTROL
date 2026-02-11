export type TraceContext = {
  traceId: string;
  spanId?: string | undefined;
  tenantId: string;
  correlationId: string;
  actorId?: string | undefined;
};

export function mkTraceContext(input: Partial<TraceContext> & Pick<TraceContext, "tenantId" | "correlationId">): TraceContext {
  const traceId = input.traceId || `tr_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  const out: TraceContext = {
    traceId,
    tenantId: input.tenantId,
    correlationId: input.correlationId,
  };
  if (input.spanId !== undefined) out.spanId = input.spanId;
  if (input.actorId !== undefined) out.actorId = input.actorId;
  return out;
}
