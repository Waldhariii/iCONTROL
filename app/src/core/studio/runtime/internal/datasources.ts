// FOUNDATION SHIM — runtime/internal/datasources
// Purpose: local stable import for render-runtime.impl.ts (avoid cross-layer path churn).
export { applyQuery, resolveDatasource } from "../../datasources/internal/datasources.impl";
export type { DatasourceDef, QueryDef } from "../../datasources/internal/datasources.impl";
