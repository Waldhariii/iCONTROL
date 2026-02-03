import { obsEmit } from "../../../core/ports/observability.facade";
import { spanStart, spanEnd } from "../../../core/ports/telemetry.facade";

export function withSpan<T>(name: string, fn: ()=>T, tags?: Record<string,string>): T {
  const s = spanStart(name, tags);
  obsEmit({ name: `page.${name}.enter`, ts: Date.now(), level: "info", tags });
  try {
    const out = fn();
    return out;
  } finally {
    spanEnd(s);
    obsEmit({ name: `page.${name}.exit`, ts: Date.now(), level: "info", tags });
  }
}
