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
    debug: (...a) => void debug(p, {}),
    info: (...a) => void info(p, {}),
    warn: (...a) => void warn(("WARN_CONSOLE_MIGRATED" as any), p, {}),
    error: (...a) => void error(("ERR_CONSOLE_MIGRATED" as any), p, {}),
  };
}

export function getLogger(prefix = "app"): Logger {
  return createLogger(prefix);
}

// Convenience exports (legacy callers)
export const logInfo = (...a: any[]) => void info("[app]", {});
export const logWarn = (...a: any[]) => void warn(("WARN_CONSOLE_MIGRATED" as any), "[app]", {});
export const logError = (...a: any[]) => void error(("ERR_CONSOLE_MIGRATED" as any), "[app]", {});

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
