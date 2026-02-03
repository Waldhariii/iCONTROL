import React from "react";
import { ClientsGrid } from "../../../ui/clients/ClientsGrid";
import { clientsPortStub } from "../../../platform/adapters/clients/clientsAdapter.stub";
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

  React.useEffect(() => {
    let alive = true;
    clientsPortStub.queryClients({
      tenantId: getTenantId(),
      correlationId: getCorrelationId(),
      query: { q, status, limit: 50, offset: 0, sort: { key: sortKey, dir: sortDir } },
    }).then((res) => {
      if (!alive) return;
      setRows(res.rows);
      setTotal(res.total);
    });
    return () => { alive = false; };
  }, [q, status, sortKey, sortDir]);

  const onSort = (k: keyof ClientRow) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  return (
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
  );
}
