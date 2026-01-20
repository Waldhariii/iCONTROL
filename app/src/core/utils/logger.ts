/**
 * ICONTROL_LOGGER_STUB_V1
 * Stub minimal pour unblock bundling/tests.
 * Remplacer par une implémentation réelle (levels, sinks, correlationId, audit) avant prod.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export function createLogger(prefix = "app"): Logger {
  const p = `[${prefix}]`;
  return {
    debug: (...a) => console.debug(p, ...a),
    info: (...a) => console.info(p, ...a),
    warn: (...a) => console.warn(p, ...a),
    error: (...a) => console.error(p, ...a),
  };
}

// Convenience exports (in case main.ts expects named helpers)
export const logInfo = (...a: any[]) => console.info("[app]", ...a);
export const logWarn = (...a: any[]) => console.warn("[app]", ...a);
export const logError = (...a: any[]) => console.error("[app]", ...a);

// AUTO-STUB export for build unblock
export function warnLog(..._args: any[]): any { return undefined; }

// AUTO-STUB export for build unblock
export function debugLog(..._args: any[]): any { return undefined; }

// AUTO-STUB export for build unblock
export function errorLog(..._args: any[]): any { return undefined; }
