import type {
  DataSource,
  DataSourceId,
  DataSourceReadResult,
  DataSourceWriteResult,
  JsonValue,
} from "./types";
import type { StudioRuntime } from "../runtime";
import { enforceSafeModeWrite } from "../../../policies/safe_mode.enforce.runtime";

export class DataSourceRouter {
  private readonly rt: StudioRuntime;

  constructor(rt: StudioRuntime) {
    this.rt = rt;
  }

  private readonly map = new Map<DataSourceId, DataSource>();

  register(ds: DataSource): void {
    this.map.set(ds.id, ds);
  }

  get(id: DataSourceId): DataSource | undefined {
    return this.map.get(id);
  }

  read(id: DataSourceId, key: string): DataSourceReadResult {
    const ds = this.map.get(id);
    if (!ds)
      return { ok: false, reason: "not_found", detail: `datasource:${id}` };
    return ds.read(key);
  }

  write(
    id: DataSourceId,
    key: string,
    value: JsonValue,
  ): DataSourceWriteResult {
    const ds = this.map.get(id);
    if (!ds)
      return {
        ok: false,
        reason: "backend_error",
        detail: `datasource_missing:${id}`,
      };
    if (!ds.write) return { ok: false, reason: "read_only" };
    // P0.7 SAFE_MODE enforcement wiring (policy-driven)
    // Router-level guard: blocks write in HARD, warns in SOFT (audit-first).
    // Map datasource write to a generic 'update' action for enforcement purposes.
    const decision = enforceSafeModeWrite(this.rt, "update", {
      ds: id,
      key,
    });
    if (!decision.allowed) {
      // HARD enforcement: fail fast (canonical code expected by contracts).
      throw new Error("ERR_SAFE_MODE_WRITE_BLOCKED");
    }
    return ds.write(key, value);
  }
}
