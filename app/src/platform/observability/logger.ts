import type { LogEvent, LogLevel } from "./types";
import type { AnyCode } from "./errorCodes";
import { getCorrelationId } from "./correlation";

function nowIso(): string {
  return new Date().toISOString();
}

function emit(evt: LogEvent): void {
  // Browser-safe sink: console.* (can be replaced later by gateway sink)
  const line = JSON.stringify(evt);
  switch (evt.level) {
    case "debug": console.debug(line); break;
    case "info": console.info(line); break;
    case "warn": console.warn(line); break;
    case "error": console.error(line); break;
  }
}

export type LogBaseContext = Pick<LogEvent, "tenantId" | "actorId" | "role" | "appKind" | "surface">;

export function log(level: LogLevel, code: AnyCode, message: string, ctx: LogBaseContext = {}, details?: Record<string, unknown>): void {
  const evt: LogEvent = {
    ts: nowIso(),
    level,
    code,
    message,
    correlationId: getCorrelationId(),
    ...ctx,
    details,
  };
  emit(evt);
}

export function info(code: AnyCode, message: string, ctx?: LogBaseContext, details?: Record<string, unknown>) {
  log("info", code, message, ctx, details);
}
export function warn(code: AnyCode, message: string, ctx?: LogBaseContext, details?: Record<string, unknown>) {
  log("warn", code, message, ctx, details);
}
export function error(code: AnyCode, message: string, ctx?: LogBaseContext, details?: Record<string, unknown>) {
  log("error", code, message, ctx, details);
}
export function debug(code: AnyCode, message: string, ctx?: LogBaseContext, details?: Record<string, unknown>) {
  log("debug", code, message, ctx, details);
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export function createLogger(prefix = "app"): Logger {
  const p = `[${prefix}]`;
  return {
    debug: (...a) => void debug("OK", p, {}, { payload: a }),
    info: (...a) => void info("OK", p, {}, { payload: a }),
    warn: (...a) => void warn("WARN_CONSOLE_MIGRATED", p, {}, { payload: a }),
    error: (...a) => void error("ERR_CONSOLE_MIGRATED", p, {}, { payload: a }),
  };
}

export function getLogger(prefix = "app"): Logger {
  return createLogger(prefix);
}
