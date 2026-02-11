/**
 * ICONTROL_LOGGER_STUB_V1
 * Minimal logger to unblock runtime/bundling.
 * Replace with a governed implementation (sinks, audit) later.
 */
import { debug, info, warn, error } from "../../platform/observability/logger";

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
    debug: (...a) => void debug(p, {}, { payload: a }),
    info: (...a) => void info("OK", p, {}, { payload: a }),
    warn: (...a) => void warn(("WARN_CONSOLE_MIGRATED" as any), p, {}, { payload: a }),
    error: (...a) => void error(("ERR_CONSOLE_MIGRATED" as any), p, {}, { payload: a }),
  };
}

export function getLogger(prefix = "app"): Logger {
  return createLogger(prefix);
}

// Convenience exports (legacy callers)
export const logInfo = (...a: any[]) => void info("OK", "[app]", {}, { payload: a });
export const logWarn = (...a: any[]) => void warn(("WARN_CONSOLE_MIGRATED" as any), "[app]", {}, { payload: a });
export const logError = (...a: any[]) => void error(("ERR_CONSOLE_MIGRATED" as any), "[app]", {}, { payload: a });

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
