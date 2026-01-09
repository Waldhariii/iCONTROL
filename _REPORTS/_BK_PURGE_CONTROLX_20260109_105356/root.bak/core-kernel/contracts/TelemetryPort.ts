import type { ErrorCode } from "../domain/errors/errorCodes";

export type TelemetryLevel = "debug" | "info" | "warn" | "error";

export type TelemetryEvent = {
  name: string;
  payload?: Record<string, unknown>;
};

export type TelemetryMetric = {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
};

export type TelemetryTrace = {
  name: string;
  durationMs: number;
  tags?: Record<string, string>;
};

export type TelemetryError = {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
};

export type TelemetryResult =
  | { ok: true }
  | { ok: false; error: TelemetryError };

export interface TelemetryPort {
  log(level: TelemetryLevel, message: string, context?: Record<string, unknown>): Promise<TelemetryResult>;
  event(evt: TelemetryEvent): Promise<TelemetryResult>;
  metric(metric: TelemetryMetric): Promise<TelemetryResult>;
  trace(trace: TelemetryTrace): Promise<TelemetryResult>;
}
