import React from "react";

type Col<T> = { key: string; header: string; accessor: (r: T) => React.ReactNode };

export function DataTable<T>(props: {
  rows: T[];
  columns: Col<T>[];
  loading?: boolean;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    onLimitChange: (v: number) => void;
    onPageChange: (newOffset: number) => void;
  };
  sort?: {
    by: string;
    dir: "asc" | "desc";
    onChange: (by: string, dir: "asc" | "desc") => void;
  };
  meta?: { virtualizationEnabled?: boolean };
}){
  const { rows, columns, loading } = props;

  if (loading) {
    return <div style={{ padding: 16, opacity: 0.8 }}>Chargement…</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {columns.map(c => (
                <td key={c.key} style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {c.accessor(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
