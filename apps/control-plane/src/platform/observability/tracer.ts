/**
 * Lightweight tracer: spans attached to correlationId.
 * Pure TS. Wrap cpFetch for automatic span per request.
 */
import { getCorrelationId } from "./correlation";

function nextSpanId(): string {
  return `span_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export type Span = {
  id: string;
  parentId: string | undefined;
  name: string;
  correlationId: string;
  start: number;
  end?: number;
  durationMs?: number;
  status: "ok" | "error";
  startMs: number;
  endMs?: number;
  meta?: Record<string, unknown>;
};

const spans: Span[] = [];
const spanStack: Span[] = [];

export function startSpan(name: string, meta?: Record<string, unknown>): Span {
  const start = Date.now();
  const parent = spanStack.length > 0 ? spanStack[spanStack.length - 1] : undefined;
  const span: Span = {
    id: nextSpanId(),
    parentId: parent?.id,
    name,
    correlationId: getCorrelationId(),
    start,
    startMs: start,
    status: "ok",
    ...(meta !== undefined ? { meta } : {}),
  };
  spans.push(span);
  spanStack.push(span);
  return span;
}

export function endSpan(span: Span, status?: "ok" | "error"): void {
  const end = Date.now();
  span.end = end;
  span.endMs = end;
  span.durationMs = end - span.start;
  span.status = status ?? span.status;
  const i = spanStack.indexOf(span);
  if (i >= 0) spanStack.splice(i, 1);
}

export function getTraceDump(): Span[] {
  return spans.map((s) => ({ ...s }));
}

/**
 * Wraps a fetch-like function so each call is wrapped in a span.
 */
export function wrapFetchWithTracer(
  fetchFn: (path: string, init?: RequestInit, retry?: boolean) => Promise<Response>,
  spanName = "cpFetch"
): (path: string, init?: RequestInit, retry?: boolean) => Promise<Response> {
  return async (path: string, init?: RequestInit, retry?: boolean): Promise<Response> => {
    const span = startSpan(spanName, { path });
    try {
      const res = await fetchFn(path, init, retry);
      endSpan(span, "ok");
      return res;
    } catch (err) {
      span.meta = { ...span.meta, error: err instanceof Error ? err.message : String(err) };
      endSpan(span, "error");
      throw err;
    }
  };
}
