import type { ErrorCode } from "../domain/errors/errorCodes";

export type SafeError = {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
};

export type SafeResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SafeError };

export interface SafeBoundary {
  run<T>(fn: () => T): SafeResult<T>;
  wrap<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => SafeResult<ReturnType<T>>;
}
