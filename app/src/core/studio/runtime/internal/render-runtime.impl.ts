import { applyQuery, resolveDatasource, DatasourceDef, QueryDef } from "./datasources";

export type ColumnDef = {
  id: string;
  key: string;
  label: string;
  type: "text" | "date" | "money" | "badge" | "action";
  rules?: string[];
  visibleForRoles?: string[];
  format?: string;
  width?: number;
  align?: "left" | "center" | "right";
  computed?: string;
};

export type TableDef = {
  id: string;
  columns: ColumnDef[];
  actions?: Array<{
    id: string;
    label: string;
    actionType: "navigate" | "openModal" | "exportCsv" | "noop";
    rules?: string[];
    requiredRoles?: string[];
    config?: Record<string, unknown>;
  }>;
};

export function resolveTableData(
  table: TableDef,
  datasources: Record<string, DatasourceDef>,
  datasourceId: string,
  query: QueryDef | undefined,
  storage: Storage
): Record<string, unknown>[] {
  const ds = datasources[datasourceId];
  if (!ds) return [];
  return applyQuery(resolveDatasource(ds, storage), query);
}
