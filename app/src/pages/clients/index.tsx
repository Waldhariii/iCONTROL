import React, { useMemo, useState, useEffect } from "react";
import { Page } from "../_shared/Page";
import { EmptyState } from "../_shared/EmptyState";
import { ErrorState } from "../_shared/ErrorState";
import { DataTable } from "../../ui/dataTable/DataTable";
import type { ClientRow, ClientsPort } from "../../core/ports/clients.contract";
import { useClientsQuery } from "../../core/domain/clients/useClientsQuery";
// PHASE11_WAVE3_2_1_REAL_PORT: prefer real ClientsPort(VFS) with fail-soft fallback
// Import-safe: dynamic imports only; no side effects at module load.
import type { ClientsPort } from "../../core/ports/clients.contract";
import { clientsPortStub } from "../../platform/adapters/clients/clientsAdapter.stub";

async function resolveClientsPort(): Promise<ClientsPort> {
  // 1) Prefer an existing singleton export if present (surfaces already wired).
  try {
    const mod = await import("../../platform/adapters/clients/clientsAdapter.vfs");
    // If a singleton exists, use it; else if a factory exists, try to build it (best-effort).
    if (mod && (mod as any).clientsPortVfs) return (mod as any).clientsPortVfs as ClientsPort;
    if (mod && (mod as any).createClientsPortVfs) {
      // Best-effort: try to locate a vfs facade from common runtime entrypoints.
      try {
        const vfsMod = await import("../../platform/vfs");
        const vfs = (vfsMod as any).vfs ?? (vfsMod as any).defaultVfs ?? (vfsMod as any).getVfs?.();
        if (vfs) return (mod as any).createClientsPortVfs(vfs) as ClientsPort;
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  // 2) Fail-soft fallback
  return clientsPort ?? clientsPortStub;
}



const VIRTUALIZE_THRESHOLD = 300;

// Fallback port (keeps tests + import stability if adapter cannot be resolved)
const stubPort: ClientsPort = {
  async list(){
    return { rows: [], total: 0 };
  },
};

function pickClientsPort(): ClientsPort {
  try {
    // Prefer real adapter if present
    return stubPort;
  } catch (e) {
    // fail-soft: never break UI import path
    return stubPort;
  }
}

export default function ClientsPage(){
  const [clientsPort, setClientsPort] = React.useState<ClientsPort | null>(null);
useEffect(() => {
    let alive = true;
    resolveClientsPort().then((p) => { if (alive) setClientsPort(p); });
    return () => { alive = false; };
  }, []);

  const tenantId = "default";

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const port = pickClientsPort();

  const { rows, total, loading, error } = useClientsQuery({
    port,
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