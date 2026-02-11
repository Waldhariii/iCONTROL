import { AUDIT_SCOPES } from "./audit.scopes";
import { emitAudit } from "./audit.emit";
import { ERROR_CODES } from "../core/errors/error_codes";

type AnyWin = any;

export type SafeModeWriteContext = {
  op: string;
  target?: string;
  data?: Record<string, unknown>;
};

/**
 * SAFE_MODE write guard — AUDIT ONLY
 * - Never blocks
 * - Never throws
 * - Idempotent per operation key
 */
export function auditSafeModeWriteAttempt(
  w: AnyWin,
  ctx: SafeModeWriteContext,
): void {
  try {
    if (!w || !w.__SAFE_MODE__?.enabled) return;

    const rt = w as any;
    const seenKey = `__SAFE_MODE_WRITE_AUDITED__:${ctx.op}`;

    if (rt[seenKey]) return;
    rt[seenKey] = true;

    const emit =
      rt?.audit?.emit ||
      rt?.audit?.log ||
      rt?.auditLog?.append ||
      rt?.core?.audit?.emit;

    if (typeof emit === "function") {
      emitAudit(
        rt,
        "WARN",
        ERROR_CODES.WARN_SAFE_MODE_WRITE_OBSERVED ??
          "WARN_SAFE_MODE_WRITE_OBSERVED",
        `SAFE_MODE active — write observed: ${ctx.op}`,
        {
          scope: AUDIT_SCOPES.SAFE_MODE,
          source: "safe_mode_write_guard",
          data: {
            op: ctx.op,
            target: ctx.target,
            data: ctx.data,
          },
        },
        "__SAFE_MODE_WRITE_AUDIT_FAILED__",
      );
    }
  } catch {
    try {
      (w as any).__SAFE_MODE_WRITE_AUDIT_FAILED__ = true;
    } catch {}
  }
}
