import type {
  DataSource,
  DataSourceId,
  DataSourceReadResult,
  DataSourceWriteResult,
  JsonValue,
} from "./types";
import { enforceSafeModeWrite } from "../../../policies/safe_mode.enforce.runtime";

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
    if (!ds)
      return { ok: false, reason: "not_found", detail: `datasource:${id}` };
    return ds.read(key);
  }

  write(
    id: DataSourceId,
    key: string,
    value: JsonValue,
  ): DataSourceWriteResult {
    // P0.8: bind router runtime (avoid globalThis) — keep non-breaking by deriving from existing handles
    const rt0: any =
      (this as any).rt ??
      (this as any).runtime ??
      (this as any).ctx?.rt ??
      (this as any).ctx?.runtime ??
      (this as any).host?.rt ??
      (this as any).host?.runtime;
    const rt: any = rt0 ?? (globalThis as any);
    if (!(this as any).rt) (this as any).rt = rt;

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
    const decision = enforceSafeModeWrite(rt, "update", {
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
