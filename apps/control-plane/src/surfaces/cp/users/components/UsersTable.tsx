/**
 * UsersTable — Table of roles (RBAC) or users; filter + select.
 */
import React from "react";
import styles from "../UsersPage.module.css";

export type TableRow = { role: string; permissions: string[] };

export interface UsersTableProps {
  rows: TableRow[];
  selectedId?: string;
  onSelect: (row: TableRow) => void;
  filterText: string;
  onFilterTextChange: (s: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function UsersTable({
  rows,
  selectedId,
  onSelect,
  filterText,
  onFilterTextChange,
  loading = false,
  error = null,
}: UsersTableProps): React.ReactElement {
  const filtered = React.useMemo(() => {
    if (!filterText.trim()) return rows;
    const q = filterText.toLowerCase().trim();
    return rows.filter(
      (r) =>
        r.role.toLowerCase().includes(q) ||
        r.permissions.some((p) => p.toLowerCase().includes(q))
    );
  }, [rows, filterText]);

  return (
    <div className={styles.tableWrap}>
      <div className={styles.filters}>
        <input
          type="search"
          placeholder="Filtrer par rôle ou permission…"
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
          className={styles.filterInput}
          aria-label="Filtrer"
        />
      </div>
      {error && (
        <div className={styles.errorBlock} role="alert">
          {error}
        </div>
      )}
      {loading && (
        <div className={styles.loadingBlock}>
          Chargement…
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className={styles.emptyBlock}>
          Aucun rôle à afficher.
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rôle</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.role}
                  onClick={() => onSelect(row)}
                  className={selectedId === row.role ? styles.rowSelected : undefined}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(row);
                    }
                  }}
                >
                  <td>{row.role}</td>
                  <td>{row.permissions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
