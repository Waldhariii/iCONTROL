import type { AuditLevel, StudioAudit } from "./studioRuntime";
import { debug, info, warn, error } from "../../../platform/observability/logger";

export type AuditSink = (
  level: AuditLevel,
  code: string,
  meta?: Record<string, unknown>,
) => void;

export interface AuditEmitterOptions {
  sink?: AuditSink;
  /**
   * Optional redaction hook applied to meta. Keep it pure/deterministic.
   */
  redact?: (meta: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Enterprise-grade default: never throw; always honor signature stability.
 * This is an adapter, not a policy engine.
 */
export function createAuditEmitter(
  opts: AuditEmitterOptions | AuditSink = {},
): StudioAudit {
  const options: AuditEmitterOptions =
    typeof opts === "function" ? { sink: opts } : opts;
  const sink: AuditSink =
    options.sink ??
    ((level, code, meta) => {
      // default sink: no-op (do not console.log in core)
      void level;
      void code;
      void meta;
    });

  const redact =
    options.redact ??
    ((meta) => {
      // default redaction: identity
      return meta;
    });

  return {
    emit(level, code, meta) {
      try {
        const safeMeta = meta ? redact(meta) : undefined;
        sink(level, code, safeMeta);
      } catch {
        // swallow: audit must never break product paths
      }
    },
  };
}
