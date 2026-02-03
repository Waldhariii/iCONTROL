export type ClientId = string;

export type ClientRow = {
  id: ClientId;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  status: "active" | "inactive";
  updatedAt: string; // ISO
};

export type ClientQuery = {
  q?: string;
  status?: "active" | "inactive" | "all";
  limit?: number;
  offset?: number;
  sort?: { key: keyof ClientRow; dir: "asc" | "desc" };
};

export type ClientQueryResult = {
  rows: ClientRow[];
  total: number;
};
