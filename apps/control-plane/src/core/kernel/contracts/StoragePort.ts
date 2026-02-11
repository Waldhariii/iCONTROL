import type { ErrorCode } from "../domain/errors/errorCodes";

export type StorageScope = string;

export type StorageReadRequest = {
  key: string;
  scope?: StorageScope;
};

export type StorageWriteRequest = {
  key: string;
  value: string;
  scope?: StorageScope;
  etag?: string;
};

export type StorageRemoveRequest = {
  key: string;
  scope?: StorageScope;
};

export type StorageListRequest = {
  scope?: StorageScope;
  prefix?: string;
};

export type StorageError = {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
};

export type StorageReadResponse =
  | { ok: true; value: string; etag?: string }
  | { ok: false; error: StorageError };

export type StorageWriteResponse =
  | { ok: true; etag?: string }
  | { ok: false; error: StorageError };

export type StorageRemoveResponse =
  | { ok: true }
  | { ok: false; error: StorageError };

export type StorageListResponse =
  | { ok: true; keys: string[] }
  | { ok: false; error: StorageError };

export interface StoragePort {
  read(req: StorageReadRequest): Promise<StorageReadResponse>;
  write(req: StorageWriteRequest): Promise<StorageWriteResponse>;
  remove(req: StorageRemoveRequest): Promise<StorageRemoveResponse>;
  list(req: StorageListRequest): Promise<StorageListResponse>;
}
