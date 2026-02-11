import { AUDIT_SCOPES } from "./audit.scopes";
import { emitAudit } from "./audit.emit";

type AnyWin = any;

export function applySafeModeSignal(w: AnyWin, cfg?: any): void {
  if (!w) return;
  if (w.__SAFE_MODE_APPLIED__) return;

  const safe = {
    enabled: Boolean(cfg?.enabled),
    reason: cfg?.reason ?? null,
    scope: cfg?.scope ?? "global",
    ts: cfg?.ts ?? new Date().toISOString(),
  };

  w.__SAFE_MODE__ = safe;
  w.__SAFE_MODE_APPLIED__ = true;

  // Audit-only (no behavior change)
  try {
    const emit =
      w?.audit?.emit ||
      w?.audit?.log ||
      w?.auditLog?.append ||
      w?.core?.audit?.emit;

    if (typeof emit === "function") {
      emitAudit(
        w,
        safe.enabled ? "WARN" : "INFO",
        safe.enabled ? "WARN_SAFE_MODE_ENABLED" : "INFO_SAFE_MODE_DISABLED",
        "SAFE_MODE signal published (audit-only)",
        {
          scope: AUDIT_SCOPES.SAFE_MODE,
          source: "safe_mode",
          data: safe,
        },
        "__SAFE_MODE_AUDIT_FAILED__",
      );
    }
  } catch {
    try {
      w.__SAFE_MODE_AUDIT_FAILED__ = true;
    } catch {}
  }
}
