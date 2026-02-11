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
  override name: string;
  readonly code: ErrorCode;
  readonly severity: ErrorSeverity;
  readonly context?: ErrorContext | undefined;
  readonly correlationId?: string | undefined;
  override readonly cause?: unknown | undefined;

  constructor(params: AppErrorParams) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.severity = params.severity ?? "error";
    if (params.context !== undefined) this.context = params.context;
    if (params.correlationId !== undefined) this.correlationId = params.correlationId;
    if (params.cause !== undefined) this.cause = params.cause;
  }
}
