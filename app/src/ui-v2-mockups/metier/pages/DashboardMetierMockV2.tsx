import React from "react";
import { PageShellV2 } from "@/ui-v2/layouts/PageShellV2";
import { CardMetierV2 } from "../components/CardMetierV2";
import { ListMetierV2 } from "../components/ListMetierV2";

export default function DashboardMetierMockV2() {
  return (
    <PageShellV2 title="Dashboard Métier — Mock V2">
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        <CardMetierV2 title="KPIs">
          <ListMetierV2 rows={[
            { id: "rev", label: "Revenus", value: "$12,450" },
            { id: "jobs", label: "Jobs", value: "38" },
            { id: "clients", label: "Clients actifs", value: "112" },
          ]}/>
        </CardMetierV2>

        <CardMetierV2 title="Alertes">
          <ul>
            <li>3 factures en retard</li>
            <li>1 module non activé</li>
          </ul>
        </CardMetierV2>
      </div>
    </PageShellV2>
  );
}
