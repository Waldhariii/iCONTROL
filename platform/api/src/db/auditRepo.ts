import type { DB } from "./types";
export type AuditWrite = {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  resourceType: string;
  metadata?: any;
};

export function writeAudit(db: DB, a: AuditWrite) {
  const created_at = new Date().toISOString();
  const metadata = a.metadata == null ? null : JSON.stringify(a.metadata);
  db.prepare(`
    INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(a.tenantId ?? null, a.userId ?? null, a.action, a.resourceType, metadata, created_at);
}
