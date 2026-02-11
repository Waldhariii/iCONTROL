// @ts-nocheck
import { obsEmit } from "../../../core/ports/observability.facade";
import { spanStart, spanEnd } from "../../../core/ports/telemetry.facade";

export function withSpan<T>(name: string, fn: ()=>T, tags?: Record<string,string>): T {
  const s = spanStart(name, tags);
  const enter = { name: `page.${name}.enter`, ts: Date.now(), level: "info" as const } as { name: string; ts: number; level: "info"; tags?: Record<string, string> };
  if (tags) enter.tags = tags;
  obsEmit(enter);
  try {
    const out = fn();
    return out;
  } finally {
    spanEnd(s);
    const exit = { name: `page.${name}.exit`, ts: Date.now(), level: "info" as const } as { name: string; ts: number; level: "info"; tags?: Record<string, string> };
    if (tags) exit.tags = tags;
    obsEmit(exit);
  }
}
