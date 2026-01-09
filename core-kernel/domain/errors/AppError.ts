import type { ErrorCode } from "./errorCodes";

export type ErrorSeverity = "info" | "warn" | "error" | "fatal";

export type ErrorContext = Record<string, unknown>;

export type AppErrorParams = {
  code: ErrorCode;
  message: string;
  severity?: ErrorSeverity;
  context?: ErrorContext;
  correlationId?: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly severity: ErrorSeverity;
  readonly context?: ErrorContext;
  readonly correlationId?: string;
  readonly cause?: unknown;

  constructor(params: AppErrorParams) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.severity = params.severity ?? "error";
    this.context = params.context;
    this.correlationId = params.correlationId;
    this.cause = params.cause;
  }
}
