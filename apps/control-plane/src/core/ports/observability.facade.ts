import type { ObservabilityContract, ObsEvent } from "./observability.contract";

let _impl: ObservabilityContract | null = null;

export function bindObservability(impl: ObservabilityContract){
  _impl = impl;
}

export function obsEmit(e: ObsEvent){
  // strict prod: never throw
  try { _impl?.emit(e); } catch {}
}
