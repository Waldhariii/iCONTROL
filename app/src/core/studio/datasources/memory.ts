import type { DataSource, DataSourceReadResult, DataSourceWriteResult, JsonValue } from "./types";
import { isNonEmptyString, isJsonValue } from "./validate";

export function createMemoryDataSource(id: string, seed?: Record<string, JsonValue>): DataSource {
  const store: Record<string, JsonValue> = { ...(seed ?? {}) };

  function read(key: string): DataSourceReadResult {
    if (!isNonEmptyString(key)) return { ok: false, reason: "invalid_key" };
    return key in store ? { ok: true, value: store[key] } : { ok: false, reason: "not_found" };
  }

  function write(key: string, value: JsonValue): DataSourceWriteResult {
    if (!isNonEmptyString(key)) return { ok: false, reason: "backend_error", detail: "invalid_key" };
    if (!isJsonValue(value)) return { ok: false, reason: "invalid_value" };
    store[key] = value;
    return { ok: true };
  }

  return { id, read, write };
}
