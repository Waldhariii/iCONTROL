import type { DB } from "./types";
export type TenantRow = {
  id: string;
  name: string;
  plan: string;
  created_at: string;
  updated_at: string;
};

export function getTenant(db: DB, tenantId: string): TenantRow | null {
  const row = db.prepare(`SELECT id, name, plan, created_at, updated_at FROM tenants WHERE id = ?`).get(tenantId);
  return (row as TenantRow) ?? null;
}

export function ensureTenant(db: DB, tenantId: string): TenantRow {
  const hit = getTenant(db, tenantId);
  if (!hit) {
    const err: any = new Error(`ERR_TENANT_NOT_FOUND: ${tenantId}`);
    err.code = "ERR_TENANT_NOT_FOUND";
    throw err;
  }
  return hit;
}
