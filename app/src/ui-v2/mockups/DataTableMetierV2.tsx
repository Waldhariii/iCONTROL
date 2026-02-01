import React from "react";

type Row = {
  id: string;
  client: string;
  statut: "brouillon" | "planifie" | "en_cours" | "termine";
  date: string;
  montant: number;
};

function fmtMoney(n: number) {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

function badgeClass(statut: Row["statut"]) {
  switch (statut) {
    case "brouillon":
      return "v2-badge v2-badge--muted";
    case "planifie":
      return "v2-badge v2-badge--info";
    case "en_cours":
      return "v2-badge v2-badge--warn";
    case "termine":
      return "v2-badge v2-badge--ok";
  }
}

export function DataTableMetierV2(props: { rows: Row[] }) {
  return (
    <div className="v2-card">
      <div className="v2-card__header">
        <div className="v2-card__title">Jobs (Mock) — Table type Excel</div>
        <div className="v2-card__subtitle">Tri/filtre à venir (P14). Layout dense.</div>
      </div>

      <div className="v2-table-wrap">
        <table className="v2-table">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th>Client</th>
              <th>Statut</th>
              <th>Date</th>
              <th className="col-money">Montant</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.id}</td>
                <td>{r.client}</td>
                <td>
                  <span className={badgeClass(r.statut)}>{r.statut.replace("_", " ")}</span>
                </td>
                <td className="mono">{r.date}</td>
                <td className="col-money mono">{fmtMoney(r.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
