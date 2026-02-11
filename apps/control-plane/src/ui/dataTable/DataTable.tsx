// @ts-nocheck
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
    return <div className="ic-table-loading">Chargement…</div>;
  }

  return (
    <div className="ic-table-wrap">
      <table className="ic-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className="ic-table__th">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {columns.map(c => (
                <td key={c.key} className="ic-table__td">
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
