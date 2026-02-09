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

function isCode(v: unknown): v is AnyCode {
  return typeof v === "string" && (
    v === "OK" ||
    v === "WARN_CONSOLE_MIGRATED" ||
    v === "ERR_CONSOLE_MIGRATED" ||
    v.startsWith("WARN_") ||
    v.startsWith("ERR_")
  );
}

function normalizeArgs(
  level: LogLevel,
  a1: AnyCode | string,
  a2?: string | LogBaseContext | Record<string, unknown>,
  a3?: LogBaseContext | Record<string, unknown>,
  a4?: Record<string, unknown>,
): { code: AnyCode; message: string; ctx?: LogBaseContext; details?: Record<string, unknown> } {
  if (isCode(a1)) {
    const code = a1;
    if (typeof a2 === "string") {
      return {
        code,
        message: a2,
        ...(a3 ? { ctx: a3 as LogBaseContext } : {}),
        ...(a4 ? { details: a4 } : {}),
      };
    }
    return {
      code,
      message: code,
      ...(a2 ? { details: a2 as Record<string, unknown> } : {}),
    };
  }

  const code: AnyCode =
    level === "error" ? "ERR_CONSOLE_MIGRATED" :
    level === "warn" ? "WARN_CONSOLE_MIGRATED" :
    "OK";

  const message = String(a1);
  const ctx = (a2 && typeof a2 === "object" && !Array.isArray(a2)) ? (a2 as LogBaseContext) : undefined;
  const details = (a3 && typeof a3 === "object" && !Array.isArray(a3)) ? (a3 as Record<string, unknown>) : undefined;
  return {
    code,
    message,
    ...(ctx ? { ctx } : {}),
    ...(details ? { details } : {}),
  };
}

export function log(code: AnyCode, message: string, ctx: LogBaseContext = {}, details?: Record<string, unknown>): void {
  const evt: LogEvent = {
    ts: nowIso(),
    level: "info",
    code,
    message,
    correlationId: getCorrelationId(),
    ...ctx,
    ...(details ? { details } : {}),
  };
  emit(evt);
}

export function info(a1: AnyCode | string, a2?: string | LogBaseContext, a3?: LogBaseContext | Record<string, unknown>, a4?: Record<string, unknown>) {
  const { code, message, ctx, details } = normalizeArgs("info", a1, a2 as any, a3 as any, a4);
  emit({
    ts: nowIso(),
    level: "info",
    code,
    message,
    correlationId: getCorrelationId(),
    ...(ctx || {}),
    ...(details ? { details } : {}),
  });
}
export function warn(a1: AnyCode | string, a2?: string | LogBaseContext, a3?: LogBaseContext | Record<string, unknown>, a4?: Record<string, unknown>) {
  const { code, message, ctx, details } = normalizeArgs("warn", a1, a2 as any, a3 as any, a4);
  emit({
    ts: nowIso(),
    level: "warn",
    code,
    message,
    correlationId: getCorrelationId(),
    ...(ctx || {}),
    ...(details ? { details } : {}),
  });
}
export function error(a1: AnyCode | string, a2?: string | LogBaseContext, a3?: LogBaseContext | Record<string, unknown>, a4?: Record<string, unknown>) {
  const { code, message, ctx, details } = normalizeArgs("error", a1, a2 as any, a3 as any, a4);
  emit({
    ts: nowIso(),
    level: "error",
    code,
    message,
    correlationId: getCorrelationId(),
    ...(ctx || {}),
    ...(details ? { details } : {}),
  });
}
export function debug(a1: AnyCode | string, a2?: string | LogBaseContext, a3?: LogBaseContext | Record<string, unknown>, a4?: Record<string, unknown>) {
  const { code, message, ctx, details } = normalizeArgs("debug", a1, a2 as any, a3 as any, a4);
  emit({
    ts: nowIso(),
    level: "debug",
    code,
    message,
    correlationId: getCorrelationId(),
    ...(ctx || {}),
    ...(details ? { details } : {}),
  });
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
    debug: (...a) => void debug(p, {}, { payload: a }),
    info: (...a) => void info(p, {}, { payload: a }),
    warn: (...a) => void warn(("WARN_CONSOLE_MIGRATED" as any), p, {}, { payload: a }),
    error: (...a) => void error(("ERR_CONSOLE_MIGRATED" as any), p, {}, { payload: a }),
  };
}

export function getLogger(prefix = "app"): Logger {
  return createLogger(prefix);
}
