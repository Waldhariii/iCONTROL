import React, { useMemo, useState } from "react";
import { METIER_ROWS, MetierRow } from "./mock-data";
import { sortBy, toggleDir, SortDir } from "./table-helpers";

type SortState = { key: keyof MetierRow; dir: SortDir } | null;

export default function DataTableSortableMetierV2() {
  const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });

  const rows = useMemo(() => {
    if (!sort) return METIER_ROWS;
    return sortBy(METIER_ROWS, sort.key, sort.dir);
  }, [sort]);

  function onSort(key: keyof MetierRow) {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: toggleDir(prev.dir) };
    });
  }

  return (
    <div style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th onClick={() => onSort("id")}>ID</th>
            <th onClick={() => onSort("client")}>Client</th>
            <th onClick={() => onSort("statut")}>Statut</th>
            <th onClick={() => onSort("montant")}>Montant</th>
            <th onClick={() => onSort("date")}>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.client}</td>
              <td>{r.statut}</td>
              <td>{r.montant.toFixed(2)}</td>
              <td>{r.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 12, marginTop: 8 }}>
        Sort: {sort ? `${String(sort.key)} ${sort.dir}` : "none"}
      </div>
    </div>
  );
}
