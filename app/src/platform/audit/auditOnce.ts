/**
 * ICONTROL_CP_AUDIT_ONCE_V1
 * Dedup WARN/INFO emissions in-memory to avoid spam.
 */
const once = new Set<string>();

export function auditWarnOnce(code: string, meta?: Record<string, any>): void {
  const key = `warn:${code}`;
  if (once.has(key)) return;
  once.add(key);

  try {
    const rt: any = (globalThis as any).__runtime || (globalThis as any).__ICONTROL_RUNTIME__;
    const emit = rt?.audit?.emit;
    if (typeof emit === "function") {
      emit("WARN", code, meta || {});
      return;
    }
  } catch {}

  // Fallback: console warn (best-effort)
  try {
    // eslint-disable-next-line no-console
    void warn("WARN_CONSOLE_MIGRATED","console migrated", { payload: (code, meta || {}) });
  } catch {}
}
import { debug, info, warn, error } from "../../platform/observability/logger";
