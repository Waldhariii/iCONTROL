import type { TelemetryContract, TelemetrySpan } from "./telemetry.contract";

let _impl: TelemetryContract | null = null;

export function bindTelemetry(impl: TelemetryContract){
  _impl = impl;
}

export function spanStart(name: string, tags?: Record<string,string>): TelemetrySpan {
  try {
    if(_impl) return _impl.spanStart(name, tags);
  } catch {}
  return tags
    ? { name, tsStart: Date.now(), tags }
    : { name, tsStart: Date.now() };
}

export function spanEnd(span: TelemetrySpan, tags?: Record<string,string>) {
  try { _impl?.spanEnd(span, tags); } catch {}
}
