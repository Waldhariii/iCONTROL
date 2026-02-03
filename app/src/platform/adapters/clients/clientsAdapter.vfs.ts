import type { ClientsPort } from "../../../core/ports/clients.contract";
import type { ClientQuery, ClientQueryResult, ClientRow } from "../../../core/domain/clients/types";
import { obsEmit } from "../../../core/ports/observability.facade";
import { vfsGet, vfsSet } from "../../write-gateway/writeGateway";

const SCOPE = "app.clients.vfs";
const KEY = "clients/index.json";
const NS = "app:clients";

function safeParse(json: string | null): ClientRow[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v.filter(Boolean);
  } catch {
    return [];
  }
}

function safeStringify(rows: ClientRow[]): string {
  return JSON.stringify(rows);
}

function applyQuery(rows: ClientRow[], query: ClientQuery): ClientQueryResult {
  const status = query.status ?? "all";
  const q = (query.q ?? "").toLowerCase().trim();

  let out = rows.slice();
  if (status !== "all") out = out.filter(r => r.status === status);
  if (q) out = out.filter(r =>
    (r.name ?? "").toLowerCase().includes(q) ||
    (r.email ?? "").toLowerCase().includes(q) ||
    (r.city ?? "").toLowerCase().includes(q)
  );

  const total = out.length;

  if (query.sort) {
    const { key, dir } = query.sort;
    out.sort((a,b) => {
      const av = String((a as any)[key] ?? "");
      const bv = String((b as any)[key] ?? "");
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.max(1, Math.min(200, query.limit ?? 50));
  out = out.slice(offset, offset + limit);

  return { rows: out, total };
}

async function loadAll(tenantId: string, correlationId: string): Promise<ClientRow[]> {
  const raw = vfsGet({ tenantId, namespace: NS }, KEY);
  const rows = safeParse(raw);
  obsEmit({
    name: "clients.vfs.load",
    ts: Date.now(),
    level: "info",
    tags: { tenantId, correlationId, scope: SCOPE },
    data: { count: rows.length },
  });
  return rows;
}

async function saveAll(tenantId: string, correlationId: string, rows: ClientRow[]): Promise<void> {
  const payload = safeStringify(rows);
  const res = await vfsSet(
    { appKind: "APP", tenantId },
    { tenantId, namespace: NS },
    KEY,
    payload,
  );
  if (!res.ok) {
    throw new Error(`${res.code}:${res.reason}`);
  }
  obsEmit({
    name: "clients.vfs.save",
    ts: Date.now(),
    level: "info",
    tags: { tenantId, correlationId, scope: SCOPE },
    data: { count: rows.length },
  });
}

export const clientsPortVfs: ClientsPort & {
  createClient: (args: { tenantId: string; correlationId: string; row: Omit<ClientRow, "id" | "updatedAt"> }) => Promise<ClientRow>;
} = {
  async queryClients({ tenantId, correlationId, query }) {
    try {
      const rows = await loadAll(tenantId, correlationId);
      return applyQuery(rows, query);
    } catch (err: any) {
      obsEmit({
        name: "clients.vfs.query.failsoft",
        ts: Date.now(),
        level: "warn",
        tags: { tenantId, correlationId, scope: SCOPE },
        data: { err: String(err?.message ?? err) },
      });
      return { rows: [], total: 0 };
    }
  },

  async createClient({ tenantId, correlationId, row }) {
    const now = new Date().toISOString();
    const id = "c_" + Math.random().toString(16).slice(2);
    const created: ClientRow = { id, updatedAt: now, status: "active", ...row };

    const all = await loadAll(tenantId, correlationId);
    const next = [created, ...all];
    await saveAll(tenantId, correlationId, next);
    return created;
  },
};
