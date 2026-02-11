export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export type DataSourceId = string;

export type DataSourceReadResult =
  | { ok: true; value: JsonValue }
  | { ok: false; reason: "not_found" | "invalid_key" | "backend_error"; detail?: string };

export type DataSourceWriteResult =
  | { ok: true }
  | { ok: false; reason: "read_only" | "invalid_value" | "backend_error"; detail?: string };

export type DataSource = {
  id: DataSourceId;
  read: (key: string) => DataSourceReadResult;
  write?: (key: string, value: JsonValue) => DataSourceWriteResult;
};
