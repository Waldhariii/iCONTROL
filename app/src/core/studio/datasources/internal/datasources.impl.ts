export type QueryFilter = { field: string; op: string; value: string };
export type QuerySort = { field: string; dir: "asc" | "desc" };
export type QueryDef = { filters?: QueryFilter[]; sort?: QuerySort[]; limit?: number };

export type DatasourceDef = {
  id: string;
  type: "static" | "localStorage" | "files" | "logs" | "api_stub";
  config?: Record<string, unknown>;
  schema?: { fields?: string[] };
};

export function resolveDatasource(def: DatasourceDef, storage: Storage): Record<string, unknown>[] {
  if (def.type === "logs") {
    const raw = storage.getItem("icontrol_logs_v1") || "[]";
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (def.type === "localStorage") {
    const key = String(def.config?.key || "");
    if (!key) return [];
    try {
      return JSON.parse(storage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }
  if (def.type === "static") {
    return (def.config?.records as Record<string, unknown>[]) || [];
  }
  return [];
}

export function applyQuery(records: Record<string, unknown>[], query?: QueryDef): Record<string, unknown>[] {
  if (!query) return records;
  let out = [...records];
  (query.filters || []).forEach((f) => {
    out = out.filter((r) => {
      const v = r[f.field];
      if (f.op === "eq") return String(v) === String(f.value);
      if (f.op === "contains") return String(v ?? "").includes(String(f.value));
      if (f.op === "gt") return Number(v) > Number(f.value);
      if (f.op === "lt") return Number(v) < Number(f.value);
      return true;
    });
  });
  (query.sort || []).forEach((s) => {
    out.sort((a, b) => {
      const av = a[s.field];
      const bv = b[s.field];
      if (String(av) === String(bv)) return 0;
      const res = String(av) > String(bv) ? 1 : -1;
      return s.dir === "desc" ? -res : res;
    });
  });
  if (query.limit && query.limit > 0) out = out.slice(0, query.limit);
  return out;
}
