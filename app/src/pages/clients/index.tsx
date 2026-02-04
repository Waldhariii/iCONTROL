import React, { useMemo, useState } from "react";
import { Page } from "../_shared/Page";
import { EmptyState } from "../_shared/EmptyState";
import { ErrorState } from "../_shared/ErrorState";
import { DataTable } from "../../ui/dataTable/DataTable";
import type { ClientRow, ClientsPort } from "../../core/ports/clients.contract";
import { useClientsQuery } from "../../core/domain/clients/useClientsQuery";

const VIRTUALIZE_THRESHOLD = 300;

const stubPort: ClientsPort = {
  async list(){
    return { rows: [], total: 0 };
  },
};

export default function ClientsPage(){
  const tenantId = "default";

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { rows, total, loading, error } = useClientsQuery({
    port: stubPort,
    tenantId,
    limit,
    offset,
    sortBy,
    sortDir,
  });

  const virtualizationEnabled = (total ?? 0) >= VIRTUALIZE_THRESHOLD;

  const columns = useMemo(() => ([
    { key: "name", header: "Nom", accessor: (r: ClientRow) => (r as any).name ?? "-" },
    { key: "email", header: "Email", accessor: (r: ClientRow) => (r as any).email ?? "-" },
    { key: "phone", header: "Téléphone", accessor: (r: ClientRow) => (r as any).phone ?? "-" },
    { key: "status", header: "Statut", accessor: (r: ClientRow) => (r as any).status ?? "-" },
  ]), []);

  return (
    <Page title="Clients" subtitle={`Total: ${total ?? 0} • Virtualisation: ${virtualizationEnabled ? "ON" : "OFF"}`}>
      {error ? <ErrorState title="Impossible de charger les clients" details={error} /> : null}

      {!error && !loading && (rows?.length ?? 0) === 0 ? (
        <EmptyState title="Aucun client" details="Aucun enregistrement ne correspond à la requête." />
      ) : null}

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        pagination={{
          limit,
          offset,
          total: total ?? 0,
          onLimitChange: (v: number) => { setLimit(v); setOffset(0); },
          onPageChange: (newOffset: number) => setOffset(newOffset),
        }}
        sort={{
          by: sortBy,
          dir: sortDir,
          onChange: (by: string, dir: "asc" | "desc") => { setSortBy(by); setSortDir(dir); setOffset(0); },
        }}
        meta={{ virtualizationEnabled }}
      />
    </Page>
  );
}
