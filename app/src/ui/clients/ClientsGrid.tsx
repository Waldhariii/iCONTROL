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
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "0 0 12px 0" }}>Clients</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input
          value={p.q}
          onChange={(e) => p.onQChange(e.target.value)}
          placeholder="Recherche (nom, email, ville)"
          style={{ padding: 10, minWidth: 340 }}
        />
        <select value={p.status} onChange={(e) => p.onStatusChange(e.target.value as any)} style={{ padding: 10 }}>
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        <div style={{ opacity: 0.7 }}>Total: {p.total}</div>
      </div>

      <div style={{ overflow: "auto", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.06)" }}>
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
                return (
                  <th
                    key={k}
                    onClick={() => p.onSort(key)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      opacity: active ? 1 : 0.85,
                    }}
                  >
                    {label}{active ? (p.sortDir === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {p.rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <td style={{ padding: "10px 12px" }}>{r.name}</td>
                <td style={{ padding: "10px 12px" }}>{r.email ?? ""}</td>
                <td style={{ padding: "10px 12px" }}>{r.phone ?? ""}</td>
                <td style={{ padding: "10px 12px" }}>{r.city ?? ""}</td>
                <td style={{ padding: "10px 12px" }}>{r.status}</td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {!p.rows.length && (
              <tr>
                <td colSpan={6} style={{ padding: 16, opacity: 0.7 }}>Aucun résultat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
