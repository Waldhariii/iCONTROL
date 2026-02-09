import type { DB } from "./types";
export function ensureBaselineTables(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      plan TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    );
  `);
}


// -------------------------------------------------------------------
// Canonical export (used by openDb)
// Minimal no-op schema hook (extend later safely).
// -------------------------------------------------------------------
export function ensureSchema(_db: any) {
  return;
}
