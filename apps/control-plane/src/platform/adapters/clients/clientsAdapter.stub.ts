import type { ClientsPort } from "../../../core/ports/clients.contract";
import type {
  ClientId,
  ClientListQueryV1,
  ClientListResultV1,
  ClientUpsertInputV1,
  ClientV1,
  ClientWriteMeta,
} from "../../../core/domain/clients/types";
import { obsEmit } from "../../../core/ports/observability.facade";

const seed = new Map<ClientId, ClientV1>();

function nowIso(): string {
  return new Date().toISOString();
}

function emitStub(name: string, meta: ClientWriteMeta, data: Record<string, unknown>) {
  obsEmit({
    name,
    ts: Date.now(),
    level: "info",
    tags: { tenantId: meta.tenantId, correlationId: meta.correlationId },
    data,
  });
}

function listAll(): ClientV1[] {
  return Array.from(seed.values());
}

function applyQuery(items: ClientV1[], q: ClientListQueryV1): ClientV1[] {
  let rows = items.slice();
  if (q.status) rows = rows.filter(r => r.status === q.status);
  if (q.q) {
    const needle = q.q.toLowerCase().trim();
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(needle) ||
      (r.email ?? "").toLowerCase().includes(needle) ||
      (r.phone ?? "").toLowerCase().includes(needle)
    );
  }
  if (q.sort) {
    const { by, dir } = q.sort;
    rows.sort((a, b) => {
      const av = String(a[by] ?? "");
      const bv = String(b[by] ?? "");
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }
  return rows;
}

export const clientsPortStub: ClientsPort = {
  async list(query: ClientListQueryV1, meta: ClientWriteMeta): Promise<ClientListResultV1> {
    emitStub("clients.list.stub", meta, { query });
    const rows = applyQuery(listAll(), query);
    const limit = Math.max(1, Math.min(200, query.limit ?? 50));
    const start = query.cursor ? parseInt(query.cursor, 10) || 0 : 0;
    const items = rows.slice(start, start + limit);
    const nextCursor = start + limit < rows.length ? String(start + limit) : null;
    return { items, nextCursor };
  },

  async getById(id: ClientId, meta: ClientWriteMeta): Promise<ClientV1 | null> {
    emitStub("clients.get.stub", meta, { id });
    return seed.get(id) ?? null;
  },

  async upsert(input: ClientUpsertInputV1, meta: ClientWriteMeta): Promise<ClientV1> {
    emitStub("clients.upsert.stub", meta, { input });
    const id = input.id ?? `c_${Math.random().toString(36).slice(2, 10)}`;
    const existing = seed.get(id);
    const now = nowIso();
    const email = input.email ?? existing?.email;
    const phone = input.phone ?? existing?.phone;
    const deletedAt = existing?.deletedAt;
    const row: ClientV1 = {
      schema: "clients.v1",
      id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      status: input.status ?? existing?.status ?? "active",
      name: input.name,
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(deletedAt !== undefined ? { deletedAt } : {}),
    };
    seed.set(id, row);
    return row;
  },

  async softDelete(id: ClientId, meta: ClientWriteMeta): Promise<{ ok: true }> {
    emitStub("clients.delete.stub", meta, { id });
    const existing = seed.get(id);
    if (existing) {
      seed.set(id, { ...existing, status: "archived", deletedAt: nowIso(), updatedAt: nowIso() });
    }
    return { ok: true };
  },
};
