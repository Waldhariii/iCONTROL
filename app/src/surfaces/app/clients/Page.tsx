import React from "react";
import { ClientsGrid } from "../../../ui/clients/ClientsGrid";
import { clientsPortVfs } from "../../../platform/adapters/clients/clientsAdapter.vfs";
import type { ClientRow } from "../../../core/domain/clients/types";

function getTenantId(): string {
  return "default";
}
function getCorrelationId(): string {
  return "corr_" + Math.random().toString(16).slice(2);
}

export default function Page() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "inactive" | "all">("all");
  const [rows, setRows] = React.useState<ClientRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [sortKey, setSortKey] = React.useState<keyof ClientRow>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [busy, setBusy] = React.useState(false);

  const tenantId = getTenantId();

  const refresh = React.useCallback(() => {
    let alive = true;
    clientsPortVfs.queryClients({
      tenantId,
      correlationId: getCorrelationId(),
      query: { q, status, limit: 50, offset: 0, sort: { key: sortKey, dir: sortDir } },
    }).then((res) => {
      if (!alive) return;
      setRows(res.rows);
      setTotal(res.total);
    });
    return () => { alive = false; };
  }, [tenantId, q, status, sortKey, sortDir]);

  React.useEffect(() => refresh(), [refresh]);

  const onSort = (k: keyof ClientRow) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const onCreate = async () => {
    setBusy(true);
    try {
      await clientsPortVfs.createClient({
        tenantId,
        correlationId: getCorrelationId(),
        row: { name: "Nouveau client", email: "", phone: "", city: "" , status: "active" },
      });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ padding: 16, paddingBottom: 0, display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={onCreate} disabled={busy} style={{ padding: "10px 12px" }}>
          {busy ? "Création..." : "Nouveau client"}
        </button>
        <div style={{ opacity: 0.65 }}>Persistance: VFS (tenant scoped)</div>
      </div>
      <ClientsGrid
        rows={rows}
        total={total}
        q={q}
        status={status}
        onQChange={setQ}
        onStatusChange={setStatus}
        onSort={onSort}
        sortKey={sortKey}
        sortDir={sortDir}
      />
    </div>
  );
}
