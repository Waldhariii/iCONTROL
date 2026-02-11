import type {
  ClientId,
  ClientListQueryV1,
  ClientListResultV1,
  ClientUpsertInputV1,
  ClientV1,
  ClientWriteMeta
} from "../domain/clients/types";

export type ClientsPort = {
  // Reads
  list(query: ClientListQueryV1, meta: ClientWriteMeta): Promise<ClientListResultV1>;
  getById(id: ClientId, meta: ClientWriteMeta): Promise<ClientV1 | null>;

  // Writes
  upsert(input: ClientUpsertInputV1, meta: ClientWriteMeta): Promise<ClientV1>;
  softDelete(id: ClientId, meta: ClientWriteMeta): Promise<{ ok: true }>;
};

export const CLIENTS_SCHEMA_V1 = "clients.v1" as const;

// Centralized VFS keys (SSOT for storage layout)
export const clientsVfsKeys = {
  dir: (tenantId: string) => `tenants/${tenantId}/clients`,
  record: (tenantId: string, id: string) => `tenants/${tenantId}/clients/${id}.json`,
  index: (tenantId: string) => `tenants/${tenantId}/clients/index.json`,
} as const;
