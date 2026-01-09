export const TABLE_COMPONENT_ID = "builtin.table";

export type TableProps = {
  title?: string;
  columns?: string[];
  rows?: Array<Record<string, unknown>>;
};

/**
 * Framework-agnostic builtin.
 * Returns an object payload (safe for non-React runtime); later adapters can render it.
 */
export function Table(props: Record<string, unknown> = {}): unknown {
  const p = props as TableProps;
  return {
    kind: "TABLE",
    title: typeof p.title === "string" ? p.title : "Table",
    columns: Array.isArray(p.columns) ? p.columns : [],
    rows: Array.isArray(p.rows) ? p.rows : [],
  };
}
