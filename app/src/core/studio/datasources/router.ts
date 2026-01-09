import type { DataSource, DataSourceId, DataSourceReadResult, DataSourceWriteResult, JsonValue } from "./types";

export class DataSourceRouter {
  private readonly map = new Map<DataSourceId, DataSource>();

  register(ds: DataSource): void {
    this.map.set(ds.id, ds);
  }

  get(id: DataSourceId): DataSource | undefined {
    return this.map.get(id);
  }

  read(id: DataSourceId, key: string): DataSourceReadResult {
    const ds = this.map.get(id);
    if (!ds) return { ok: false, reason: "not_found", detail: `datasource:${id}` };
    return ds.read(key);
  }

  write(id: DataSourceId, key: string, value: JsonValue): DataSourceWriteResult {
    const ds = this.map.get(id);
    if (!ds) return { ok: false, reason: "backend_error", detail: `datasource_missing:${id}` };
    if (!ds.write) return { ok: false, reason: "read_only" };
    return ds.write(key, value);
  }
}
