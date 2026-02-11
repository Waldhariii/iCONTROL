import type { TraceContext } from "./trace";

export type TraceEvent = {
  ts: string;
  name: string;
  level: "info" | "warn" | "error";
  ctx: TraceContext;
  fields?: Record<string, unknown>;
};

export function emitTrace(ev: TraceEvent): void {
  // Stub: integrate with platform observability logger/metrics later
  // Must remain side-effect safe and browser-compatible.
  void ev;
}
