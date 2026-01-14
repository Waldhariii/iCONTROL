import type { AuditLevel, StudioAudit } from "./studioRuntime";

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
  opts: AuditEmitterOptions = {},
): StudioAudit {
  const sink: AuditSink =
    opts.sink ??
    ((level, code, meta) => {
      // default sink: no-op (do not console.log in core)
      void level;
      void code;
      void meta;
    });

  const redact =
    opts.redact ??
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
