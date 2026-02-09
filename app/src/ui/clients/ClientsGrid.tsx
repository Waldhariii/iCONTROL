import React from "react";
import type { ClientRow } from "../../core/domain/clients/types";

type Props = {
  rows: ClientRow[];
  total: number;
  q: string;
  status: "active" | "inactive" | "all";
  onQChange: (v: string) => void;
  onStatusChange: (v: "active" | "inactive" | "all") => void;
  onSort: (key: keyof ClientRow) => void;
  sortKey?: keyof ClientRow;
  sortDir?: "asc" | "desc";
};

export function ClientsGrid(p: Props) {
  return (
    <div className="ic-clients-page">
      <h2 className="ic-clients-title">Clients</h2>

      <div className="ic-clients-toolbar">
        <input
          value={p.q}
          onChange={(e) => p.onQChange(e.target.value)}
          placeholder="Recherche (nom, email, ville)"
          className="ic-clients-input"
        />
        <select
          value={p.status}
          onChange={(e) => p.onStatusChange(e.target.value as any)}
          className="ic-clients-select"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <div className="ic-clients-total">Total: {p.total}</div>
      </div>

      <div className="ic-clients-table-wrap">
        <table className="ic-clients-table">
          <thead>
            <tr className="ic-clients-head-row">
              {[
                ["name", "Nom"],
                ["email", "Email"],
                ["phone", "Téléphone"],
                ["city", "Ville"],
                ["status", "Statut"],
                ["updatedAt", "Maj"],
              ].map(([k, label]) => {
                const key = k as keyof ClientRow;
                const active = p.sortKey === key;
                const thClass = active ? "ic-clients-th ic-clients-th--active" : "ic-clients-th";
                return (
                  <th
                    key={k}
                    onClick={() => p.onSort(key)}
                    className={thClass}
                  >
                    {label}{active ? (p.sortDir === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {p.rows.map((r) => (
              <tr key={r.id} className="ic-clients-row">
                <td className="ic-clients-td">{r.name}</td>
                <td className="ic-clients-td">{r.email ?? ""}</td>
                <td className="ic-clients-td">{r.phone ?? ""}</td>
                <td className="ic-clients-td">{r.city ?? ""}</td>
                <td className="ic-clients-td">{r.status}</td>
                <td className="ic-clients-td ic-clients-td--nowrap">{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {!p.rows.length && (
              <tr>
                <td colSpan={6} className="ic-clients-empty">Aucun résultat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
