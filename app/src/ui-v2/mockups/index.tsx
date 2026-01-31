import React from "react";
import { useMetierDashboardAdapter, useMetierListeAdapter, useMetierFicheAdapter } from "../metier/adapters";
import { PageShellV2 } from "../PageShellV2";
import { FiltersBarV2, type FiltersState } from "./FiltersBarV2";
import { DataTableMetierV2 } from "./DataTableMetierV2";
import { FormMetierV2 } from "./FormMetierV2";

// __METIER_ADAPTERS_WIRED_V1: mockups consume adapters (do not remove)

const ROWS = [
  { id: "JOB-00021", client: "Safari Park", statut: "planifie" as const, date: "2026-01-30", montant: 420.0 },
  { id: "JOB-00022", client: "Extermination Innovex", statut: "en_cours" as const, date: "2026-02-01", montant: 860.0 },
  { id: "JOB-00023", client: "Résidentiel (Mock)", statut: "brouillon" as const, date: "2026-02-03", montant: 195.0 },
  { id: "JOB-00024", client: "Commercial (Mock)", statut: "termine" as const, date: "2026-01-25", montant: 1290.0 },
];

export default function UiMetierSandboxV2() {
  const [filters, setFilters] = React.useState<FiltersState>({ q: "", statut: "tous" });

  const filtered = ROWS.filter((r) => {
    const q = filters.q.trim().toLowerCase();
    const okQ = !q || r.client.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const okS = filters.statut === "tous" || r.statut === filters.statut;
    return okQ && okS;
  });

  return (
    <PageShellV2 title="UI Métier — Sandbox V2 (P13)">
      <FiltersBarV2 value={filters} onChange={setFilters} />
      <div style={{ display: "grid", gap: 12 }}>
        <DataTableMetierV2 rows={filtered} />
        <FormMetierV2 />
      </div>
    </PageShellV2>
  );
}


function MetierAdaptersDemoV1() {
  const dashboard = useMetierDashboardAdapter();
  const liste = useMetierListeAdapter();
  const fiche = useMetierFicheAdapter();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section>
        <h3>Dashboard model</h3>
        <pre>{JSON.stringify(dashboard, null, 2)}</pre>
      </section>
      <section>
        <h3>Liste model</h3>
        <pre>{JSON.stringify(liste, null, 2)}</pre>
      </section>
      <section>
        <h3>Fiche model</h3>
        <pre>{JSON.stringify(fiche, null, 2)}</pre>
      </section>
    </div>
  );
}
export { MetierAdaptersDemoV1 };
