import type { ClientsPort } from "../../../core/ports/clients.contract";
import { CLIENTS_SCHEMA_V1, clientsVfsKeys } from "../../../core/ports/clients.contract";
import type {
  ClientId,
  ClientListQueryV1,
  ClientListResultV1,
  ClientUpsertInputV1,
  ClientV1,
  ClientWriteMeta
} from "../../../core/domain/clients/types";

// NOTE: we keep dependencies local to avoid import-time side effects.
// VFS API is expected to exist in platform adapters; adapt if your VFS facade differs.
type VfsFacade = {
  readJson<T>(key: string): Promise<T>;
  writeJson<T>(key: string, value: T): Promise<void>;
  list(prefix: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;
};

const nowIso = () => new Date().toISOString();

function requireMeta(meta: ClientWriteMeta) {
  if (!meta?.tenantId) throw Object.assign(new Error("tenantId required"), { code: "ERR_TENANT_REQUIRED" });
  if (!meta?.correlationId) throw Object.assign(new Error("correlationId required"), { code: "ERR_CORRELATION_REQUIRED" });
}

function normalizeQuery(q: ClientListQueryV1): Required<Pick<ClientListQueryV1,"limit">> & ClientListQueryV1 {
  return {
    limit: Math.min(Math.max(q.limit ?? 100, 1), 500),
    ...q,
  };
}

// Minimal fail-soft migration: if schema missing or old-ish, coerce to v1.
function migrateToV1(anyObj: any): ClientV1 | null {
  if (!anyObj || typeof anyObj !== "object") return null;

  const id = String(anyObj.id ?? "");
  const name = String(anyObj.name ?? "");
  if (!id || !name) return null;

  const createdAt = String(anyObj.createdAt ?? nowIso());
  const updatedAt = String(anyObj.updatedAt ?? createdAt);
  const status = (anyObj.status === "inactive" || anyObj.status === "archived") ? anyObj.status : "active";

  const v1: ClientV1 = {
    schema: CLIENTS_SCHEMA_V1,
    id,
    createdAt,
    updatedAt,
    status,
    name,
    email: anyObj.email ? String(anyObj.email) : undefined,
    phone: anyObj.phone ? String(anyObj.phone) : undefined,
    deletedAt: anyObj.deletedAt ? String(anyObj.deletedAt) : undefined,
  };

  return v1;
}

async function readClient(vfs: VfsFacade, tenantId: string, id: string): Promise<ClientV1 | null> {
  const key = clientsVfsKeys.record(tenantId, id);
  try {
    const raw = await vfs.readJson<any>(key);
    const v1 = migrateToV1(raw);
    if (!v1) return null;

    // Opportunistic self-heal: if schema mismatch, rewrite to v1 (fail-soft)
    if (raw?.schema !== CLIENTS_SCHEMA_V1) {
      await vfs.writeJson(key, v1);
    }
    return v1;
  } catch {
    return null;
  }
}

async function writeClient(vfs: VfsFacade, tenantId: string, client: ClientV1): Promise<void> {
  const key = clientsVfsKeys.record(tenantId, client.id);
  await vfs.writeJson(key, client);
}

async function rebuildIndex(vfs: VfsFacade, tenantId: string): Promise<string[]> {
  const keys = await vfs.list(clientsVfsKeys.dir(tenantId));
  const ids = keys
    .filter(k => k.endsWith(".json") && !k.endsWith("/index.json"))
    .map(k => k.split("/").pop()!.replace(/\.json$/,""))
    .filter(Boolean);
  await vfs.writeJson(clientsVfsKeys.index(tenantId), { schema: "clients.index.v1", ids, updatedAt: nowIso() });
  return ids;
}

async function getIndexIds(vfs: VfsFacade, tenantId: string): Promise<string[]> {
  const idxKey = clientsVfsKeys.index(tenantId);
  try {
    if (!(await vfs.exists(idxKey))) return await rebuildIndex(vfs, tenantId);
    const idx = await vfs.readJson<any>(idxKey);
    const ids = Array.isArray(idx?.ids) ? idx.ids.map(String) : null;
    if (!ids) return await rebuildIndex(vfs, tenantId);
    return ids;
  } catch {
    return await rebuildIndex(vfs, tenantId);
  }
}

function matchQuery(c: ClientV1, q: ClientListQueryV1): boolean {
  if (!q.includeDeleted && c.deletedAt) return false;
  if (q.status && c.status !== q.status) return false;
  if (q.q) {
    const needle = q.q.toLowerCase();
    const hay = `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
    if (!hay.includes(needle)) return false;
  }
  return true;
}

function sortClients(items: ClientV1[], q: ClientListQueryV1): ClientV1[] {
  const sort = q.sort ?? { by: "name", dir: "asc" as const };
  const dir = sort.dir === "desc" ? -1 : 1;
  const get = (c: ClientV1) => {
    switch (sort.by) {
      case "createdAt": return c.createdAt;
      case "updatedAt": return c.updatedAt;
      case "status": return c.status;
      case "name":
      default: return c.name.toLowerCase();
    }
  };
  return items.slice().sort((a,b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * dir);
}

export function makeClientsAdapterVfs(vfs: VfsFacade): ClientsPort {
  return {
    async list(query: ClientListQueryV1, meta: ClientWriteMeta): Promise<ClientListResultV1> {
      requireMeta(meta);
      const tenantId = meta.tenantId;
      const q = normalizeQuery(query);

      const ids = await getIndexIds(vfs, tenantId);

      // NOTE: cursor is reserved for later; current impl is simple slice.
      const start = 0;
      const limit = q.limit;

      const loaded: ClientV1[] = [];
      for (const id of ids) {
        const c = await readClient(vfs, tenantId, id);
        if (c) loaded.push(c);
      }

      const filtered = sortClients(loaded.filter(c => matchQuery(c, q)), q);
      const page = filtered.slice(start, start + limit);

      const nextCursor = (filtered.length > start + limit) ? "cursor_reserved_v1" : null;
      return { items: page, nextCursor };
    },

    async getById(id: ClientId, meta: ClientWriteMeta): Promise<ClientV1 | null> {
      requireMeta(meta);
      return await readClient(vfs, meta.tenantId, id);
    },

    async upsert(input: ClientUpsertInputV1, meta: ClientWriteMeta): Promise<ClientV1> {
      requireMeta(meta);
      const tenantId = meta.tenantId;

      const id = String(input.id ?? `c_${Math.random().toString(36).slice(2,10)}_${Date.now()}`);
      const existing = await readClient(vfs, tenantId, id);

      const createdAt = existing?.createdAt ?? nowIso();
      const client: ClientV1 = {
        schema: CLIENTS_SCHEMA_V1,
        id,
        createdAt,
        updatedAt: nowIso(),
        status: input.status ?? existing?.status ?? "active",
        name: input.name,
        email: input.email ?? existing?.email,
        phone: input.phone ?? existing?.phone,
        deletedAt: existing?.deletedAt,
      };

      await writeClient(vfs, tenantId, client);

      // keep index warm (fail-soft)
      try {
        const ids = await getIndexIds(vfs, tenantId);
        if (!ids.includes(id)) {
          await vfs.writeJson(clientsVfsKeys.index(tenantId), { schema: "clients.index.v1", ids: [...ids, id], updatedAt: nowIso() });
        }
      } catch { /* ignore */ }

      return client;
    },

    async softDelete(id: ClientId, meta: ClientWriteMeta): Promise<{ ok: true }> {
      requireMeta(meta);
      const tenantId = meta.tenantId;

      const existing = await readClient(vfs, tenantId, String(id));
      if (!existing) return { ok: true };

      const client: ClientV1 = {
        ...existing,
        schema: CLIENTS_SCHEMA_V1,
        updatedAt: nowIso(),
        deletedAt: nowIso(),
        status: existing.status === "archived" ? "archived" : "inactive",
      };

      await writeClient(vfs, tenantId, client);
      return { ok: true };
    },
  };
}
