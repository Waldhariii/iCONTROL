import type { ErrorCode } from "../domain/errors/errorCodes";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

export type HttpRequest = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
};

export type HttpResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

export type HttpError = {
  code: ErrorCode;
  message: string;
  status?: number;
  detail?: Record<string, unknown>;
};

export type HttpResult =
  | { ok: true; response: HttpResponse }
  | { ok: false; error: HttpError };

export interface HttpClientPort {
  request(req: HttpRequest): Promise<HttpResult>;
}
