export type ClientId = string;

export type ClientStatus = "active" | "inactive" | "archived";

export type ClientV1 = {
  schema: "clients.v1";
  id: ClientId;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  status: ClientStatus;

  // business fields (minimal, UI can extend later)
  name: string;
  email?: string;
  phone?: string;

  // soft delete
  deletedAt?: string; // ISO
};

export type ClientListQueryV1 = {
  q?: string;                 // search term (name/email/phone)
  status?: ClientStatus;      // filter
  includeDeleted?: boolean;   // ops/debug only
  limit?: number;             // default adapter-side
  cursor?: string | null;     // optional (future pagination)
  sort?: {
    by: "name" | "updatedAt" | "createdAt" | "status";
    dir: "asc" | "desc";
  };
};

export type ClientListResultV1 = {
  items: ClientV1[];
  nextCursor: string | null; // null when exhausted
};

export type ClientUpsertInputV1 = {
  id?: ClientId; // if absent -> create
  name: string;
  email?: string;
  phone?: string;
  status?: ClientStatus; // default active
};

export type ClientWriteMeta = {
  tenantId: string;
  correlationId: string;
  actorId?: string;
};
