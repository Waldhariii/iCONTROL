/**
 * Trace Context — single-source correlation identifiers for observability.
 * Contract:
 * - Must be idempotent: same runtime keeps same ids
 * - Must never throw
 * - Must not require an emitter
 */
type AnyRt = any;

function genId(prefix: string): string {
  // Non-crypto ID is enough for correlation (not security). Keep deterministic-ish format.
  const r = Math.random().toString(16).slice(2);
  const t = Date.now().toString(16);
  return `${prefix}_${t}_${r}`;
}

export type TraceContext = {
  tenant: string;
  traceId: string;
  requestId: string;
};

export function getOrCreateTraceContext(rt: AnyRt): TraceContext {
  try {
    if (!rt) {
      return { tenant: "default", traceId: genId("trace"), requestId: genId("req") };
    }

    const existing = rt.__TRACE_CONTEXT__;
    if (existing && typeof existing === "object") {
      const tenant = String(existing.tenant || rt.__tenant || "default");
      const traceId = String(existing.traceId || genId("trace"));
      const requestId = String(existing.requestId || genId("req"));
      const ctx = { tenant, traceId, requestId };
      rt.__TRACE_CONTEXT__ = ctx;
      return ctx;
    }

    const tenant = String(rt.__tenant || "default");
    const ctx = { tenant, traceId: genId("trace"), requestId: genId("req") };
    rt.__TRACE_CONTEXT__ = ctx;
    return ctx;
  } catch {
    return { tenant: "default", traceId: genId("trace"), requestId: genId("req") };
  }
}
