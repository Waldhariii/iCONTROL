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

    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      config_json TEXT,
      health_status TEXT,
      fallback_provider_id TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_settings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branding_settings (
      tenant_id TEXT PRIMARY KEY,
      logo_url TEXT,
      primary_color TEXT,
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

    CREATE TABLE IF NOT EXISTS user_prefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      pref_key TEXT NOT NULL,
      pref_value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(tenant_id, user_id, pref_key)
    );

    CREATE TABLE IF NOT EXISTS cp_pages (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      path TEXT,
      status TEXT NOT NULL,
      module_id TEXT,
      permissions_json TEXT,
      feature_flag_id TEXT,
      state TEXT,
      version INTEGER,
      published_at TEXT,
      activated_at TEXT,
      is_active INTEGER,
      draft_json TEXT,
      published_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_presets (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_shared INTEGER,
      created_by TEXT,
      usage_count INTEGER,
      query_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rbac_permissions (
      tenant_id TEXT NOT NULL,
      role TEXT NOT NULL,
      permissions_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (tenant_id, role)
    );

    CREATE TABLE IF NOT EXISTS outbox_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      delivered_at TEXT
    );
  `);
}


// -------------------------------------------------------------------
// Canonical export (used by openDb)
// Minimal no-op schema hook (extend later safely).
// -------------------------------------------------------------------
export function ensureSchema(_db: any) {
  try {
    ensureBaselineTables(_db as DB);
    const db = _db as DB;
    const ensureColumn = (table: string, column: string, ddl: string) => {
      try {
        const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
        if (!cols.some((c) => c.name === column)) {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
        }
      } catch {
        // keep resilient
      }
    };
    ensureColumn("cp_pages", "state", "state TEXT");
    ensureColumn("cp_pages", "version", "version INTEGER");
    ensureColumn("cp_pages", "published_at", "published_at TEXT");
    ensureColumn("cp_pages", "activated_at", "activated_at TEXT");
    ensureColumn("cp_pages", "is_active", "is_active INTEGER");
    ensureColumn("cp_pages", "draft_json", "draft_json TEXT");
    ensureColumn("cp_pages", "published_json", "published_json TEXT");
    ensureColumn("audit_presets", "description", "description TEXT");
    ensureColumn("audit_presets", "is_shared", "is_shared INTEGER");
    ensureColumn("audit_presets", "created_by", "created_by TEXT");
    ensureColumn("audit_presets", "usage_count", "usage_count INTEGER");
  } catch {
    // keep boot resilient
  }
}
