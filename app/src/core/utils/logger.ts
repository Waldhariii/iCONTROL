/**
 * ICONTROL_LOGGER_STUB_V1
 * Minimal logger to unblock runtime/bundling.
 * Replace with a governed implementation (levels, sinks, audit) later.
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

export function getLogger(prefix = "app"): Logger {
  return createLogger(prefix);
}

// Convenience exports (legacy callers)
export const logInfo = (...a: any[]) => console.info("[app]", ...a);
export const logWarn = (...a: any[]) => console.warn("[app]", ...a);
export const logError = (...a: any[]) => console.error("[app]", ...a);

// AUTO-STUB exports for legacy compatibility
export function warnLog(..._args: any[]): any {
  return undefined;
}
export function debugLog(..._args: any[]): any {
  return undefined;
}
export function errorLog(..._args: any[]): any {
  return undefined;
}
