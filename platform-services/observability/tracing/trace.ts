export type TraceContext = {
  traceId: string;
  spanId?: string;
  tenantId: string;
  correlationId: string;
  actorId?: string;
};

export function mkTraceContext(input: Partial<TraceContext> & Pick<TraceContext, "tenantId" | "correlationId">): TraceContext {
  const traceId = input.traceId || `tr_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  return { traceId, spanId: input.spanId, tenantId: input.tenantId, correlationId: input.correlationId, actorId: input.actorId };
}
