import type { BreakerState } from "./circuit.breaker";
import { incCounter, setGauge } from "./metrics.registry";

type AnyRt = any;

export function noteBreakerState(rt: AnyRt, key: string, state: BreakerState) {
  try {
    setGauge(rt, "breaker.state", state === "OPEN" ? 1 : state === "HALF_OPEN" ? 0.5 : 0, { key });
  } catch {}
}

export function noteBreakerOpen(rt: AnyRt, key: string) {
  try {
    incCounter(rt, "breaker.open.count", 1, { key });
  } catch {}
}

export function noteBreakerCall(rt: AnyRt, key: string, outcome: "ok" | "fail" | "timeout" | "open") {
  try {
    incCounter(rt, "breaker.call.count", 1, { key, outcome });
  } catch {}
}
