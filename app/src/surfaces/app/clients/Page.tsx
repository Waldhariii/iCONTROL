import React from "react";
import { getTenantIdSSOT } from "../../../core/tenant/tenantContext";
import { newCorrelationIdSSOT } from "../../../core/observability/correlation";
import { ClientsGrid } from "../../../ui/clients/ClientsGrid";
import type { ClientRow } from "../../../core/domain/clients/types";

/**
 * Governance goals:
 * - No inline styles (CSS classes only)
 * - Import-safe: avoid hard dependency on adapter at module load (lazy import)
 * - Fail-soft: UI must not crash if adapter missing/unavailable
 * - Correlation/Tenant normalized (best-effort SSOT)
 */

type ClientsQueryReq = {
  tenantId: string;
  correlationId: string;
  query: {
    q: string;
    status: "active" | "inactive" | "all";
    limit: number;
    offset: number;
    sort: { key: keyof ClientRow; dir: "asc" | "desc" };
  };
};

type ClientsCreateReq = {
  tenantId: string;
  correlationId: string;
  row: Partial<ClientRow> & { name: string };
};

type ClientsPort = {
  queryClients(req: ClientsQueryReq): Promise<{ rows: ClientRow[]; total: number }>;
  createClient(req: ClientsCreateReq): Promise<void>;
};

function safeCorrelationId(): string {
  // Prefer any existing correlation helper if it exists in runtime (best-effort).
  // Keep deterministic-ish prefix for observability filtering.
  return "corr_" + (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2));
}

function safeTenantId(): string {
  // Prefer any SSOT tenant provider if present; fallback to default.
  // This is deliberately conservative to avoid breaking imports.
  try {
    // @ts-ignore
    const t = (globalThis as any).__ICONTROL_TENANT__?.id;
    if (typeof t === "string" && t.trim()) return t;
  } catch {}
  return "default";
}

const stubPort: ClientsPort = {
  async queryClients() {
    return { rows: [], total: 0 };
  },
  async createClient() {
    // no-op
  },
};

async function resolveClientsPort(): Promise<ClientsPort> {
  // Lazy import adapter; never throw.
  try {
    const mod = await import("../../../platform/adapters/clients/clientsAdapter.vfs");
    const port = (mod as any)?.clientsPortVfs;
    if (port) return port as ClientsPort;
  } catch {}
  return stubPort;
}

export default function Page() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "inactive" | "all">("all");
  const [rows, setRows] = React.useState<ClientRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [sortKey, setSortKey] = React.useState<keyof ClientRow>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [busy, setBusy] = React.useState(false);
  const [port, setPort] = React.useState<ClientsPort>(stubPort);

  const tenantId = safeTenantId();

  React.useEffect(() => {
    let alive = true;
    resolveClientsPort().then((p) => { if (alive) setPort(p); });
    return () => { alive = false; };
  }, []);

  const refresh = React.useCallback(() => {
    let alive = true
    port.queryClients({
      tenantId,
      correlationId: safeCorrelationId(),
      query: { q, status, limit: 50, offset: 0, sort: { key: sortKey, dir: sortDir } },
    }).then((res) => {
      if (!alive) return;
      setRows(res.rows);
      setTotal(res.total);
    });
    return () => { alive = false; };
  }, [port, tenantId, q, status, sortKey, sortDir]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const onSort = (k: keyof ClientRow) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const onCreate = async () => {
    setBusy(true);
    try {
      await port.createClient({
        tenantId,
        correlationId: safeCorrelationId(),
        row: { name: "Nouveau client", email: "", phone: "", city: "", status: "active" } as any,
      });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ic-page">
      <div className="ic-toolbar">
        <button className="ic-btn" onClick={onCreate} disabled={busy}>
          {busy ? "Création..." : "Nouveau client"}
        </button>
        <div className="ic-note">Persistance: VFS (tenant scoped)</div>
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
