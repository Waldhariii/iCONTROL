import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { openDb } from './db/db';

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const existing = String(req.headers["x-correlation-id"] || "").trim();
  const cid = existing || `corr_${crypto.randomUUID()}`;
  (req as any).correlationId = cid;
  res.setHeader("x-correlation-id", cid);
  next();
});

// Chemin absolu vers la DB
const dbPath = path.join(__dirname, '..', 'icontrol.db');
const db = openDb(process.env.ICONTROL_DB_FILE || dbPath);

type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER";
type AuditRow = {
  id: number;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  metadata: string | null;
  created_at: string;
};

const ROLE_RANK: Record<Role, number> = {
  USER: 1,
  ADMIN: 2,
  SYSADMIN: 3,
  DEVELOPER: 4,
};

function getRole(req: express.Request): Role {
  const raw = String(req.headers["x-user-role"] || "USER").toUpperCase();
  if (raw === "ADMIN" || raw === "SYSADMIN" || raw === "DEVELOPER") return raw as Role;
  return "USER";
}

function getPermissions(req: express.Request): string[] {
  const raw = String(req.headers["x-user-permissions"] || "");
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function getUserId(req: express.Request): string {
  return String(req.headers["x-user-id"] || "");
}

function getTenantId(req: express.Request): string {
  return String(req.headers["x-tenant-id"] || "default");
}

function getCorrelationId(req: express.Request): string {
  return String((req as any).correlationId || "");
}

function requireAnyRole(req: express.Request, res: express.Response, allowed: Role[]): boolean {
  const role = getRole(req);
  const ok = allowed.some((r) => ROLE_RANK[role] >= ROLE_RANK[r]);
  if (!ok) {
    sendError(res, 403, "FORBIDDEN", "FORBIDDEN", { role });
  }
  return ok;
}

function requirePermission(req: express.Request, res: express.Response, opts: { roles: Role[]; permission: string }): boolean {
  const perms = getPermissions(req);
  if (perms.includes(opts.permission)) return true;
  if (requireAnyRole(req, res, opts.roles)) return true;
  sendError(res, 403, "FORBIDDEN", "FORBIDDEN", { permission: opts.permission, role: getRole(req) });
  return false;
}

function sendError(
  res: express.Response,
  status: number,
  code: string,
  message?: string,
  details?: Record<string, unknown>
) {
  const payload: any = { success: false, error: message || code, code };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}

const PAGE_PERMS = {
  create: { roles: ["ADMIN", "SYSADMIN"] as Role[], permission: "cp.pages.create" },
  update: { roles: ["ADMIN", "SYSADMIN"] as Role[], permission: "cp.pages.update" },
  delete: { roles: ["SYSADMIN"] as Role[], permission: "cp.pages.delete" },
  publish: { roles: ["SYSADMIN"] as Role[], permission: "cp.pages.publish" },
  activate: { roles: ["SYSADMIN"] as Role[], permission: "cp.pages.activate" },
  sync: { roles: ["SYSADMIN"] as Role[], permission: "cp.pages.sync" },
};

const TENANT_PERMS = {
  write: { roles: ["ADMIN", "SYSADMIN", "DEVELOPER"] as Role[], permission: "cp.tenants.write" },
};
const PROVIDER_PERMS = {
  write: { roles: ["SYSADMIN", "DEVELOPER"] as Role[], permission: "cp.providers.write" },
};
const POLICY_PERMS = {
  write: { roles: ["SYSADMIN", "DEVELOPER"] as Role[], permission: "cp.policies.write" },
};
const SECURITY_PERMS = {
  write: { roles: ["SYSADMIN", "DEVELOPER"] as Role[], permission: "cp.security.write" },
};
const BRANDING_PERMS = {
  write: { roles: ["ADMIN", "SYSADMIN", "DEVELOPER"] as Role[], permission: "cp.branding.write" },
};

function resolveSsotPath(file: string): string {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const runtimePath = path.join(repoRoot, "runtime", "configs", "ssot", file);
  if (fs.existsSync(runtimePath)) return runtimePath;
  return path.resolve(__dirname, "..", "..", "config", "ssot", file);
}

function validateCpPagePayload(payload: any): { ok: boolean; error?: string } {
  const routeId = String(payload?.route_id || "").trim();
  const title = String(payload?.title || "").trim();
  const path = String(payload?.path || "").trim();
  if (!routeId) return { ok: false, error: "ROUTE_ID_REQUIRED" };
  if (!title) return { ok: false, error: "TITLE_REQUIRED" };
  if (path && !path.startsWith("#/")) return { ok: false, error: "PATH_INVALID" };
  return { ok: true };
}

function serializeCpPageDraft(payload: {
  route_id: string;
  title: string;
  path: string | null;
  status: string;
  module_id: string | null;
  permissions_required: string[];
  feature_flag_id: string | null;
}) {
  return JSON.stringify({
    route_id: payload.route_id,
    title: payload.title,
    path: payload.path,
    status: payload.status,
    module_id: payload.module_id,
    permissions_required: payload.permissions_required,
    feature_flag_id: payload.feature_flag_id,
  });
}

function syncCpRouteCatalogFromDb(): { count: number } {
  const catalogPath = path.resolve(__dirname, "..", "..", "config", "ssot", "ROUTE_CATALOG.json");
  const raw = fs.readFileSync(catalogPath, "utf-8");
  const json = JSON.parse(raw) as { routes: any[] };
  const routes = Array.isArray(json.routes) ? json.routes : [];
  const pages = db.prepare(`SELECT * FROM cp_pages`).all() as any[];

  const byRoute = new Map<string, any>();
  routes.forEach((r) => {
    if (r?.route_id && r?.app_surface === "CP") {
      byRoute.set(r.route_id, r);
    }
  });

  for (const page of pages) {
    const routeId = String(page.route_id);
    const entry = byRoute.get(routeId) || { route_id: routeId, app_surface: "CP" };
    entry.path = page.path ?? entry.path ?? null;
    entry.page_module_id = page.module_id ?? entry.page_module_id ?? null;
    entry.permissions_required = page.permissions_json ? JSON.parse(page.permissions_json) : entry.permissions_required ?? [];
    entry.feature_flag_id = page.feature_flag_id ?? entry.feature_flag_id ?? null;
    entry.tenant_visibility = entry.tenant_visibility ?? "all";
    if (page.is_active) {
      entry.status = page.status || "ACTIVE";
    } else {
      entry.status = "HIDDEN";
    }

    if (!byRoute.has(routeId)) routes.push(entry);
  }

  json.routes = routes;
  fs.writeFileSync(catalogPath, JSON.stringify(json, null, 2));
  return { count: pages.length };
}

function auditWrite(req: express.Request, action: string, resourceType: string, metadata?: Record<string, unknown>) {
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req) || "unknown";
    const role = getRole(req);
    const correlationId = getCorrelationId(req);
    const now = new Date().toISOString();
    const payload = JSON.stringify({ role, correlationId, ...(metadata || {}) });
    db.prepare(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      tenantId,
      userId,
      action,
      resourceType,
      payload,
      now
    );
    db.prepare(
      `INSERT INTO outbox_events (event_type, payload, status, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(
      `AUDIT_${action}`,
      JSON.stringify({ tenantId, userId, action, resourceType, metadata: JSON.parse(payload), ts: now }),
      "PENDING",
      now
    );
  } catch {}
}

function seedDefaults() {
  const now = new Date().toISOString();

  try {
    const tenantCount = db.prepare(`SELECT COUNT(*) as c FROM tenants`).get() as { c: number };
    if (!tenantCount?.c) {
      db.prepare(`INSERT INTO tenants (id, name, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
        "default",
        "Tenant Default",
        "FREE",
        now,
        now
      );
    }
  } catch {}

  try {
    const providerCount = db.prepare(`SELECT COUNT(*) as c FROM providers`).get() as { c: number };
    if (!providerCount?.c) {
      const insert = db.prepare(`INSERT INTO providers (id, name, type, status, config_json, health_status, fallback_provider_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      insert.run("prov-local-storage", "Storage Local", "storage", "ACTIVE", "{}", "OK", null, now);
      insert.run("prov-ocr-basic", "OCR Basic", "ocr", "ACTIVE", "{}", "OK", null, now);
      insert.run("prov-messaging-email", "Email Provider", "messaging", "ACTIVE", "{}", "OK", null, now);
    }
  } catch {}

  try {
    const policyCount = db.prepare(`SELECT COUNT(*) as c FROM policies`).get() as { c: number };
    if (!policyCount?.c) {
      const insert = db.prepare(`INSERT INTO policies (id, name, status, updated_at) VALUES (?, ?, ?, ?)`);
      insert.run("pol-access", "Access Control", "ACTIVE", now);
      insert.run("pol-entitlements", "Entitlements Guard", "ACTIVE", now);
      insert.run("pol-rate-limit", "Rate Limit", "ACTIVE", now);
    }
  } catch {}

  try {
    const secCount = db.prepare(`SELECT COUNT(*) as c FROM security_settings`).get() as { c: number };
    if (!secCount?.c) {
      const insert = db.prepare(`INSERT INTO security_settings (id, name, status, updated_at) VALUES (?, ?, ?, ?)`);
      insert.run("sec-mfa", "MFA Administrateurs", "ENFORCED", now);
      insert.run("sec-password", "Password Policy", "ACTIVE", now);
      insert.run("sec-rotation", "Key Rotation", "SCHEDULED", now);
    }
  } catch {}

  try {
    const brandingCount = db.prepare(`SELECT COUNT(*) as c FROM branding_settings`).get() as { c: number };
    if (!brandingCount?.c) {
      db.prepare(`INSERT INTO branding_settings (tenant_id, logo_url, primary_color, updated_at) VALUES (?, ?, ?, ?)`)
        .run("default", "", "#3b82f6", now);
    }
  } catch {}
}

seedDefaults();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

app.get('/api/cp/audit', (req, res) => {
  try {
    const limit = Math.max(1, Math.min(1000, Number(req.query.limit || 200)));
    const offset = Math.max(0, Number(req.query.offset || 0));
    const q = String(req.query.q || "");
    const tenantId = String(req.query.tenant_id || "");
    const userId = String(req.query.user_id || "");
    const role = String(req.query.role || "");
    const start = String(req.query.start || "");
    const end = String(req.query.end || "");
    const action = String(req.query.action || "");
    const resource = String(req.query.resource_type || "");

    const where: string[] = [];
    const args: any[] = [];

    if (tenantId) { where.push("tenant_id = ?"); args.push(tenantId); }
    if (userId) { where.push("user_id = ?"); args.push(userId); }
    if (role) { where.push("metadata LIKE ?"); args.push(`%\"role\":\"${role}\"%`); }
    if (action) { where.push("action = ?"); args.push(action); }
    if (resource) { where.push("resource_type = ?"); args.push(resource); }
    if (start) { where.push("created_at >= ?"); args.push(start); }
    if (end) { where.push("created_at <= ?"); args.push(end); }
    if (q) {
      where.push("(action LIKE ? OR resource_type LIKE ? OR user_id LIKE ? OR tenant_id LIKE ? OR metadata LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like, like, like);
    }

    const baseSql = `
      SELECT id, tenant_id, user_id, action, resource_type, metadata, created_at
      FROM audit_logs
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
    `;
    const countSql = `SELECT COUNT(*) as c FROM audit_logs ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
    const total = (db.prepare(countSql).get(...args) as { c: number })?.c ?? 0;

    const sql = `
      ${baseSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    args.push(limit, offset);

    const rows = db.prepare(sql).all(...args);
    res.json({ success: true, data: rows, meta: { total, limit, offset } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/logs', (req, res) => {
  try {
    const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)));
    const rows = db.prepare(
      `SELECT id, tenant_id, user_id, action, resource_type, metadata, created_at
       FROM audit_logs
       ORDER BY id DESC
       LIMIT ?`
    ).all(limit) as Array<{
      id: number;
      tenant_id: string | null;
      user_id: string | null;
      action: string;
      resource_type: string;
      metadata: string | null;
      created_at: string;
    }>;

    const out = rows.map((r) => {
      let level = "info";
      let correlationId: string | undefined;
      let message = r.action || "LOG";
      try {
        if (r.metadata) {
          const meta = JSON.parse(r.metadata);
          if (meta && typeof meta.level === "string") level = meta.level;
          if (meta && typeof meta.correlationId === "string") correlationId = meta.correlationId;
          if (meta && typeof meta.message === "string") message = meta.message;
        }
      } catch {}
      return {
        ts: r.created_at,
        level,
        message,
        correlationId,
        tenantId: r.tenant_id,
        userId: r.user_id,
        resourceType: r.resource_type,
        action: r.action,
      };
    });

    res.json(out);
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/metrics', (req, res) => {
  try {
    const now = new Date();
    const since24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const since14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const total24 = (db.prepare(
      `SELECT COUNT(*) as c FROM audit_logs WHERE created_at >= ?`
    ).get(since24) as { c: number })?.c ?? 0;

    const activeUsers = (db.prepare(
      `SELECT COUNT(DISTINCT user_id) as c FROM audit_logs WHERE created_at >= ?`
    ).get(since24) as { c: number })?.c ?? 0;

    const warn24h = (db.prepare(
      `SELECT COUNT(*) as c FROM audit_logs WHERE created_at >= ? AND (action LIKE 'WARN%' OR metadata LIKE '%\"level\":\"warn\"%')`
    ).get(since24) as { c: number })?.c ?? 0;

    const err24h = (db.prepare(
      `SELECT COUNT(*) as c FROM audit_logs WHERE created_at >= ? AND (action LIKE 'ERR%' OR action LIKE 'ERROR%' OR metadata LIKE '%\"level\":\"error\"%')`
    ).get(since24) as { c: number })?.c ?? 0;

    const topModuleRow = db.prepare(
      `SELECT resource_type as rt, COUNT(*) as c
       FROM audit_logs
       WHERE created_at >= ?
       GROUP BY resource_type
       ORDER BY c DESC
       LIMIT 1`
    ).get(since24) as { rt?: string } | undefined;

    const peakRow = db.prepare(
      `SELECT MAX(cnt) as peak FROM (
         SELECT strftime('%Y-%m-%d %H', created_at) as h, COUNT(*) as cnt
         FROM audit_logs
         WHERE created_at >= ?
         GROUP BY h
       )`
    ).get(since24) as { peak?: number } | undefined;

    const providersActive = (db.prepare(
      `SELECT COUNT(*) as c FROM providers WHERE status = 'ACTIVE'`
    ).get() as { c: number } | undefined)?.c ?? 0;

    const providersInactive = (db.prepare(
      `SELECT COUNT(*) as c FROM providers WHERE status IS NULL OR status != 'ACTIVE'`
    ).get() as { c: number } | undefined)?.c ?? 0;

    const dailyRows = db.prepare(
      `SELECT substr(created_at,1,10) as d, COUNT(*) as c
       FROM audit_logs
       WHERE created_at >= ?
       GROUP BY d
       ORDER BY d ASC`
    ).all(since14) as Array<{ d: string; c: number }>;

    const byDay = new Map(dailyRows.map((r) => [r.d, r.c]));
    const series: number[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      series.push(byDay.get(key) || 0);
    }

    res.json({
      kpi: {
        cpuPct: null,
        memPct: null,
        latencyMs: null,
        api24h: total24,
        jobs24h: 0,
        activeUsers,
        warn24h,
        err24h,
        modulesActive: providersActive,
        modulesInactive: providersInactive,
        topModule: topModuleRow?.rt || null,
        peak24h: peakRow?.peak ?? null,
      },
      series: {
        apiDaily: series,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/audit-presets', (req, res) => {
  if (!requireAnyRole(req, res, ["ADMIN", "SYSADMIN", "DEVELOPER"])) return;
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const scope = String(req.query.scope || "all");
    const order = String(req.query.order || "updated");
    const where: string[] = ["tenant_id = ?"];
    const args: any[] = [tenantId];
    if (scope === "private") {
      where.push("(is_shared IS NULL OR is_shared = 0)");
      where.push("created_by = ?");
      args.push(userId);
    } else if (scope === "shared") {
      where.push("is_shared = 1");
    }
    const orderBy = order === "usage" ? "usage_count DESC, updated_at DESC" : "updated_at DESC";
    const rows = db.prepare(
      `SELECT id, name, description, is_shared, created_by, usage_count, query_json, created_at, updated_at
       FROM audit_presets
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderBy}`
    ).all(...args);
    res.json({ success: true, data: rows });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/audit-presets', (req, res) => {
  if (!requireAnyRole(req, res, ["ADMIN", "SYSADMIN", "DEVELOPER"])) return;
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const now = new Date().toISOString();
    const { id, name, query, description, is_shared } = req.body || {};
    const presetId = id && String(id).trim() ? String(id).trim() : `preset-${Date.now()}`;
    const presetName = String(name || "").trim();
    if (!presetName) {
      res.status(400).json({ success: false, error: "NAME_REQUIRED" });
      return;
    }
    const presetDesc = String(description || "").trim();
    const shared = is_shared ? 1 : 0;
    const queryJson = JSON.stringify(query || {});
    const existing = db.prepare(`SELECT created_by FROM audit_presets WHERE id = ? AND tenant_id = ?`).get(presetId, tenantId) as { created_by?: string } | undefined;
    if (existing?.created_by && existing.created_by !== userId) {
      const role = getRole(req);
      if (role !== "SYSADMIN" && role !== "ADMIN") {
        res.status(403).json({ success: false, error: "FORBIDDEN_OWNER" });
        return;
      }
    }
    db.prepare(
      `INSERT INTO audit_presets (id, tenant_id, name, description, is_shared, created_by, usage_count, query_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, is_shared = excluded.is_shared, query_json = excluded.query_json, updated_at = excluded.updated_at`
    ).run(presetId, tenantId, presetName, presetDesc, shared, userId, 0, queryJson, now, now);
    auditWrite(req, "AUDIT_PRESET_UPSERT", "audit_presets", { id: presetId, name: presetName, shared });
    res.json({ success: true, data: { id: presetId } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.delete('/api/cp/audit-presets/:id', (req, res) => {
  if (!requireAnyRole(req, res, ["ADMIN", "SYSADMIN", "DEVELOPER"])) return;
  try {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { id } = req.params;
    const existing = db.prepare(`SELECT created_by FROM audit_presets WHERE id = ? AND tenant_id = ?`).get(id, tenantId) as { created_by?: string } | undefined;
    if (existing?.created_by && existing.created_by !== userId) {
      const role = getRole(req);
      if (role !== "SYSADMIN" && role !== "ADMIN") {
        res.status(403).json({ success: false, error: "FORBIDDEN_OWNER" });
        return;
      }
    }
    db.prepare(`DELETE FROM audit_presets WHERE id = ? AND tenant_id = ?`).run(id, tenantId);
    auditWrite(req, "AUDIT_PRESET_DELETE", "audit_presets", { id });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/audit-presets/:id/use', (req, res) => {
  if (!requireAnyRole(req, res, ["ADMIN", "SYSADMIN", "DEVELOPER"])) return;
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    db.prepare(`UPDATE audit_presets SET usage_count = COALESCE(usage_count, 0) + 1, updated_at = ? WHERE id = ? AND tenant_id = ?`)
      .run(new Date().toISOString(), id, tenantId);
    auditWrite(req, "AUDIT_PRESET_USE", "audit_presets", { id });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/rbac', (req, res) => {
  if (!requireAnyRole(req, res, ["ADMIN", "SYSADMIN"])) return;
  try {
    const tenantId = getTenantId(req);
    const rows = db.prepare(`SELECT role, permissions_json, updated_at FROM rbac_permissions WHERE tenant_id = ?`).all(tenantId);
    const roles: Record<string, string[]> = {};
    rows.forEach((r: any) => {
      try {
        roles[String(r.role)] = JSON.parse(r.permissions_json || "[]");
      } catch {
        roles[String(r.role)] = [];
      }
    });
    res.json({ success: true, data: { roles } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/rbac', (req, res) => {
  if (!requireAnyRole(req, res, ["ADMIN", "SYSADMIN"])) return;
  try {
    const tenantId = getTenantId(req);
    const now = new Date().toISOString();
    const roles = (req.body && req.body.roles) || {};
    if (!roles || typeof roles !== "object") {
      res.status(400).json({ success: false, error: "ROLES_REQUIRED" });
      return;
    }
    const stmt = db.prepare(
      `INSERT INTO rbac_permissions (tenant_id, role, permissions_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(tenant_id, role) DO UPDATE SET permissions_json = excluded.permissions_json, updated_at = excluded.updated_at`
    );
    Object.keys(roles).forEach((role) => {
      const perms = Array.isArray(roles[role]) ? roles[role] : [];
      stmt.run(tenantId, String(role), JSON.stringify(perms), now);
    });
    auditWrite(req, "RBAC_UPDATE", "rbac_permissions", { roles: Object.keys(roles) });
    res.json({ success: true, data: { roles: Object.keys(roles) } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/outbox', (req, res) => {
  if (!requireAnyRole(req, res, ["SYSADMIN", "ADMIN"])) return;
  try {
    const rows = db.prepare(
      `SELECT id, event_type, payload, status, created_at, delivered_at FROM outbox_events ORDER BY id DESC LIMIT 200`
    ).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/outbox/:id/ack', (req, res) => {
  if (!requireAnyRole(req, res, ["SYSADMIN", "ADMIN"])) return;
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    db.prepare(`UPDATE outbox_events SET status = ?, delivered_at = ? WHERE id = ?`).run("DELIVERED", now, id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/audit.csv', (req, res) => {
  try {
    const q = String(req.query.q || "");
    const tenantId = String(req.query.tenant_id || "");
    const userId = String(req.query.user_id || "");
    const role = String(req.query.role || "");
    const start = String(req.query.start || "");
    const end = String(req.query.end || "");
    const action = String(req.query.action || "");
    const resource = String(req.query.resource_type || "");

    const where: string[] = [];
    const args: any[] = [];

    if (tenantId) { where.push("tenant_id = ?"); args.push(tenantId); }
    if (userId) { where.push("user_id = ?"); args.push(userId); }
    if (role) { where.push("metadata LIKE ?"); args.push(`%\"role\":\"${role}\"%`); }
    if (action) { where.push("action = ?"); args.push(action); }
    if (resource) { where.push("resource_type = ?"); args.push(resource); }
    if (start) { where.push("created_at >= ?"); args.push(start); }
    if (end) { where.push("created_at <= ?"); args.push(end); }
    if (q) {
      where.push("(action LIKE ? OR resource_type LIKE ? OR user_id LIKE ? OR tenant_id LIKE ? OR metadata LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like, like, like);
    }

    const sql = `
      SELECT id, tenant_id, user_id, action, resource_type, metadata, created_at
      FROM audit_logs
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY id DESC
    `;
    const header = ["id","tenant_id","user_id","action","resource_type","metadata","created_at"];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"audit.csv\"");
    const stream = String(req.query.stream || "") === "1";
    if (stream) {
      res.write(header.map(escape).join(",") + "\n");
      const stmt = db.prepare(sql) as any;
      for (const row of stmt.iterate(...args) as Iterable<AuditRow>) {
        res.write([
          row.id, row.tenant_id ?? "", row.user_id ?? "", row.action, row.resource_type, row.metadata ?? "", row.created_at
        ].map(escape).join(",") + "\n");
      }
      return res.end();
    }

    const rows = (db.prepare(sql) as any).all(...args) as AuditRow[];
    const lines = [header.map(escape).join(",")];
    for (const row of rows) {
      lines.push([
        row.id, row.tenant_id ?? "", row.user_id ?? "", row.action, row.resource_type, row.metadata ?? "", row.created_at
      ].map(escape).join(","));
    }
    res.send(lines.join("\n"));
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/audit.json', (req, res) => {
  try {
    const q = String(req.query.q || "");
    const tenantId = String(req.query.tenant_id || "");
    const userId = String(req.query.user_id || "");
    const role = String(req.query.role || "");
    const start = String(req.query.start || "");
    const end = String(req.query.end || "");
    const action = String(req.query.action || "");
    const resource = String(req.query.resource_type || "");

    const where: string[] = [];
    const args: any[] = [];

    if (tenantId) { where.push("tenant_id = ?"); args.push(tenantId); }
    if (userId) { where.push("user_id = ?"); args.push(userId); }
    if (role) { where.push("metadata LIKE ?"); args.push(`%\"role\":\"${role}\"%`); }
    if (action) { where.push("action = ?"); args.push(action); }
    if (resource) { where.push("resource_type = ?"); args.push(resource); }
    if (start) { where.push("created_at >= ?"); args.push(start); }
    if (end) { where.push("created_at <= ?"); args.push(end); }
    if (q) {
      where.push("(action LIKE ? OR resource_type LIKE ? OR user_id LIKE ? OR tenant_id LIKE ? OR metadata LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like, like, like);
    }

    const sql = `
      SELECT id, tenant_id, user_id, action, resource_type, metadata, created_at
      FROM audit_logs
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY id DESC
    `;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"audit.json\"");
    const stream = String(req.query.stream || "") === "1";
    if (stream) {
      res.write("[");
      let first = true;
      const stmt = db.prepare(sql);
      for (const r of stmt.iterate(...args) as any) {
        if (!first) res.write(",");
        first = false;
        res.write(JSON.stringify(r));
      }
      res.write("]");
      return res.end();
    }

    const rows = db.prepare(sql).all(...args) as any[];
    res.send(JSON.stringify(rows, null, 2));
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/tenants', (req, res) => {
  try {
    const rows = db.prepare(`SELECT id, name, plan, created_at, updated_at FROM tenants ORDER BY name ASC`).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/tenants', (req, res) => {
  if (!requirePermission(req, res, TENANT_PERMS.write)) return;
  try {
    const { id, name, plan } = req.body || {};
    const now = new Date().toISOString();
    const tenantId = id && String(id).trim() ? String(id).trim() : `tenant-${Date.now()}`;
    const tenantName = name && String(name).trim() ? String(name).trim() : "Tenant";
    const tenantPlan = plan && String(plan).trim() ? String(plan).trim() : "FREE";

    db.prepare(`INSERT INTO tenants (id, name, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .run(tenantId, tenantName, tenantPlan, now, now);
    auditWrite(req, "TENANT_CREATE", "tenants", { id: tenantId, name: tenantName, plan: tenantPlan });
    res.json({ success: true, data: { id: tenantId } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare(`SELECT id, name, plan, created_at, updated_at FROM tenants WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ success: false, error: "TENANT_NOT_FOUND" });
    res.json({ success: true, data: row });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, TENANT_PERMS.write)) return;
  try {
    const { name, plan } = req.body || {};
    const now = new Date().toISOString();
    db.prepare(`UPDATE tenants SET name = ?, plan = ?, updated_at = ? WHERE id = ?`)
      .run(String(name ?? ""), String(plan ?? ""), now, id);
    auditWrite(req, "TENANT_UPDATE", "tenants", { id, name, plan });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.delete('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  if (id === "default") {
    return res.status(400).json({ success: false, error: "CANNOT_DELETE_DEFAULT" });
  }
  if (!requirePermission(req, res, TENANT_PERMS.write)) return;
  try {
    db.prepare(`DELETE FROM tenants WHERE id = ?`).run(id);
    auditWrite(req, "TENANT_DELETE", "tenants", { id });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/providers', (req, res) => {
  try {
    const rows = db.prepare(`SELECT id, name, type, status, config_json, health_status, fallback_provider_id, updated_at FROM providers ORDER BY type ASC`).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/pages', (req, res) => {
  try {
    const rows = db.prepare(
      `SELECT id, route_id, title, path, status, module_id, permissions_json, feature_flag_id, state, version, published_at, activated_at, is_active, draft_json, published_json, created_at, updated_at
       FROM cp_pages ORDER BY updated_at DESC`
    ).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/pages', (req, res) => {
  if (!requirePermission(req, res, PAGE_PERMS.create)) return;
  try {
    const { id, route_id, title, path, status, module_id, permissions_required, feature_flag_id } = req.body || {};
    const validation = validateCpPagePayload({ route_id, title, path });
    if (!validation.ok) {
      return sendError(res, 400, validation.error || "VALIDATION_ERROR");
    }
    const now = new Date().toISOString();
    const rowId = id && String(id).trim() ? String(id).trim() : `page-${Date.now()}`;
    const routeId = route_id && String(route_id).trim() ? String(route_id).trim() : `page_${Date.now()}`;
    const pageTitle = title && String(title).trim() ? String(title).trim() : "Page";
    const pagePath = path && String(path).trim() ? String(path).trim() : null;
    const pageStatus = status && String(status).trim() ? String(status).trim() : "ACTIVE";
    const moduleId = module_id && String(module_id).trim() ? String(module_id).trim() : null;
    const featureFlag = feature_flag_id && String(feature_flag_id).trim() ? String(feature_flag_id).trim() : null;
    const permsArr = Array.isArray(permissions_required)
      ? permissions_required.map((p) => String(p).trim()).filter(Boolean)
      : String(permissions_required || "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
    const permsJson = JSON.stringify(permsArr);
    const existing = db.prepare(`SELECT id FROM cp_pages WHERE route_id = ?`).get(routeId) as { id?: string } | undefined;
    if (existing?.id) {
      res.status(409).json({ success: false, error: "ROUTE_ID_EXISTS" });
      return;
    }
    const draftJson = serializeCpPageDraft({
      route_id: routeId,
      title: pageTitle,
      path: pagePath,
      status: pageStatus,
      module_id: moduleId,
      permissions_required: permsArr,
      feature_flag_id: featureFlag,
    });

    db.prepare(
      `INSERT INTO cp_pages (id, route_id, title, path, status, module_id, permissions_json, feature_flag_id, state, version, is_active, draft_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(rowId, routeId, pageTitle, pagePath, pageStatus, moduleId, permsJson, featureFlag, "DRAFT", 1, 0, draftJson, now, now);

    auditWrite(req, "CP_PAGE_CREATE", "cp_pages", { id: rowId, route_id: routeId, title: pageTitle, status: pageStatus });
    res.json({ success: true, data: { id: rowId } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/pages/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PAGE_PERMS.update)) return;
  try {
    const { route_id, title, path, status, module_id, permissions_required, feature_flag_id, expected_version } = req.body || {};
    const validation = validateCpPagePayload({ route_id, title, path });
    if (!validation.ok) {
      return sendError(res, 400, validation.error || "VALIDATION_ERROR");
    }
    const now = new Date().toISOString();
    const routeId = route_id && String(route_id).trim() ? String(route_id).trim() : "";
    const pageTitle = title && String(title).trim() ? String(title).trim() : "";
    const pagePath = path && String(path).trim() ? String(path).trim() : null;
    const pageStatus = status && String(status).trim() ? String(status).trim() : "ACTIVE";
    const moduleId = module_id && String(module_id).trim() ? String(module_id).trim() : null;
    const featureFlag = feature_flag_id && String(feature_flag_id).trim() ? String(feature_flag_id).trim() : null;
    const permsArr = Array.isArray(permissions_required)
      ? permissions_required.map((p) => String(p).trim()).filter(Boolean)
      : String(permissions_required || "")
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
    const permsJson = JSON.stringify(permsArr);

    const current = db.prepare(`SELECT state, is_active, version FROM cp_pages WHERE id = ?`).get(id) as { state?: string; is_active?: number; version?: number } | undefined;
    if (expected_version !== undefined && expected_version !== null) {
      const cur = Number(current?.version ?? 0);
      const exp = Number(expected_version);
      if (Number.isFinite(exp) && exp !== cur) {
        return sendError(res, 409, "ERR_VERSION_CONFLICT", "ERR_VERSION_CONFLICT", { expected: exp, current: cur });
      }
    }
    let nextState = current?.state ?? "DRAFT";
    let nextActive = current?.is_active ?? 0;
    if (current?.state === "PUBLISHED") {
      nextState = "DRAFT";
      nextActive = 0;
    }
    const draftJson = serializeCpPageDraft({
      route_id: routeId,
      title: pageTitle,
      path: pagePath,
      status: pageStatus,
      module_id: moduleId,
      permissions_required: permsArr,
      feature_flag_id: featureFlag,
    });

    db.prepare(
      `UPDATE cp_pages
       SET route_id = ?, title = ?, path = ?, status = ?, module_id = ?, permissions_json = ?, feature_flag_id = ?, state = ?, is_active = ?, draft_json = ?, updated_at = ?
       WHERE id = ?`
    ).run(routeId, pageTitle, pagePath, pageStatus, moduleId, permsJson, featureFlag, nextState, nextActive, draftJson, now, id);

    auditWrite(req, "CP_PAGE_UPDATE", "cp_pages", { id, route_id: routeId, title: pageTitle, status: pageStatus, state: nextState });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.delete('/api/cp/pages/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PAGE_PERMS.delete)) return;
  try {
    db.prepare(`DELETE FROM cp_pages WHERE id = ?`).run(id);
    auditWrite(req, "CP_PAGE_DELETE", "cp_pages", { id });
    try { syncCpRouteCatalogFromDb(); } catch {}
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/pages/:id/publish', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PAGE_PERMS.publish)) return;
  try {
    const now = new Date().toISOString();
    const row = db.prepare(`SELECT version, route_id, title, path, status, module_id, permissions_json, feature_flag_id, draft_json FROM cp_pages WHERE id = ?`)
      .get(id) as { version?: number; route_id?: string; title?: string; path?: string | null; status?: string; module_id?: string | null; permissions_json?: string | null; feature_flag_id?: string | null; draft_json?: string | null } | undefined;
    const expected = req.body?.expected_version;
    if (expected !== undefined && expected !== null) {
      const cur = Number(row?.version ?? 0);
      const exp = Number(expected);
      if (Number.isFinite(exp) && exp !== cur) {
        return sendError(res, 409, "ERR_VERSION_CONFLICT", "ERR_VERSION_CONFLICT", { expected: exp, current: cur });
      }
    }
    const nextVersion = (row?.version ?? 0) + 1;
    let draftJson = row?.draft_json;
    if (!draftJson) {
      const permsArr = row?.permissions_json ? JSON.parse(row.permissions_json) : [];
      draftJson = serializeCpPageDraft({
        route_id: String(row?.route_id || ""),
        title: String(row?.title || ""),
        path: row?.path ?? null,
        status: String(row?.status || "ACTIVE"),
        module_id: row?.module_id ?? null,
        permissions_required: Array.isArray(permsArr) ? permsArr : [],
        feature_flag_id: row?.feature_flag_id ?? null,
      });
    }
    db.prepare(
      `UPDATE cp_pages SET state = ?, version = ?, published_at = ?, draft_json = ?, published_json = ?, updated_at = ? WHERE id = ?`
    ).run("PUBLISHED", nextVersion, now, draftJson, draftJson, now, id);
    auditWrite(req, "CP_PAGE_PUBLISH", "cp_pages", { id, version: nextVersion });
    try { syncCpRouteCatalogFromDb(); } catch {}
    res.json({ success: true, data: { id, version: nextVersion } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/pages/:id/revert', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PAGE_PERMS.update)) return;
  try {
    const now = new Date().toISOString();
    const row = db.prepare(`SELECT published_json FROM cp_pages WHERE id = ?`).get(id) as { published_json?: string | null } | undefined;
    if (!row?.published_json) {
      return sendError(res, 400, "NO_PUBLISHED_VERSION");
    }
    let parsed: any = null;
    try { parsed = JSON.parse(row.published_json); } catch {}
    if (!parsed) {
      return sendError(res, 400, "PUBLISHED_JSON_INVALID");
    }
    const permsArr = Array.isArray(parsed.permissions_required) ? parsed.permissions_required : [];
    const permsJson = JSON.stringify(permsArr);
    db.prepare(
      `UPDATE cp_pages
       SET route_id = ?, title = ?, path = ?, status = ?, module_id = ?, permissions_json = ?, feature_flag_id = ?, state = ?, is_active = ?, draft_json = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      String(parsed.route_id || ""),
      String(parsed.title || ""),
      parsed.path ?? null,
      String(parsed.status || "ACTIVE"),
      parsed.module_id ?? null,
      permsJson,
      parsed.feature_flag_id ?? null,
      "DRAFT",
      0,
      row.published_json,
      now,
      id
    );
    auditWrite(req, "CP_PAGE_REVERT_DRAFT", "cp_pages", { id });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/pages/:id/activate', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PAGE_PERMS.activate)) return;
  try {
    const expected = req.body?.expected_version;
    if (expected !== undefined && expected !== null) {
      const row = db.prepare(`SELECT version FROM cp_pages WHERE id = ?`).get(id) as { version?: number } | undefined;
      const cur = Number(row?.version ?? 0);
      const exp = Number(expected);
      if (Number.isFinite(exp) && exp !== cur) {
        return sendError(res, 409, "ERR_VERSION_CONFLICT", "ERR_VERSION_CONFLICT", { expected: exp, current: cur });
      }
    }
    const now = new Date().toISOString();
    db.prepare(`UPDATE cp_pages SET is_active = 1, activated_at = ?, updated_at = ? WHERE id = ?`)
      .run(now, now, id);
    auditWrite(req, "CP_PAGE_ACTIVATE", "cp_pages", { id });
    try { syncCpRouteCatalogFromDb(); } catch {}
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/pages/:id/deactivate', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PAGE_PERMS.activate)) return;
  try {
    const expected = req.body?.expected_version;
    if (expected !== undefined && expected !== null) {
      const row = db.prepare(`SELECT version FROM cp_pages WHERE id = ?`).get(id) as { version?: number } | undefined;
      const cur = Number(row?.version ?? 0);
      const exp = Number(expected);
      if (Number.isFinite(exp) && exp !== cur) {
        return sendError(res, 409, "ERR_VERSION_CONFLICT", "ERR_VERSION_CONFLICT", { expected: exp, current: cur });
      }
    }
    const now = new Date().toISOString();
    db.prepare(`UPDATE cp_pages SET is_active = 0, updated_at = ? WHERE id = ?`)
      .run(now, id);
    auditWrite(req, "CP_PAGE_DEACTIVATE", "cp_pages", { id });
    try { syncCpRouteCatalogFromDb(); } catch {}
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/pages/sync-catalog', (req, res) => {
  if (!requirePermission(req, res, PAGE_PERMS.sync)) return;
  try {
    const result = syncCpRouteCatalogFromDb();
    auditWrite(req, "CP_PAGE_SYNC_CATALOG", "cp_pages", { count: result.count });
    res.json({ success: true, data: { count: result.count } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/providers/metrics', (req, res) => {
  try {
    const days = Math.max(3, Math.min(30, Number(req.query.days ?? 14)));
    const now = new Date();
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - i);
      labels.push(d.toISOString().slice(0, 10));
    }
    const indexByDay = new Map(labels.map((label, idx) => [label, idx]));
    const startIso = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString();
    const rows = db.prepare(`SELECT metadata, created_at FROM audit_logs WHERE resource_type = ? AND created_at >= ?`)
      .all("providers", startIso);
    const series: Record<string, number[]> = {};
    rows.forEach((row: any) => {
      if (!row?.metadata || !row?.created_at) return;
      let meta: any = null;
      try {
        meta = JSON.parse(row.metadata);
      } catch {
        return;
      }
      const id = String(meta?.id || "");
      if (!id) return;
      const day = String(row.created_at).slice(0, 10);
      const idx = indexByDay.get(day);
      if (idx === undefined) return;
      if (!series[id]) series[id] = Array(labels.length).fill(0);
      series[id][idx] += 1;
    });
    res.json({ success: true, data: { labels, series } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/prefs/:key', (req, res) => {
  try {
    const prefKey = String(req.params.key || "");
    const tenantId = getTenantId(req);
    const userId = getUserId(req) || "anonymous";
    const row = db.prepare(`SELECT pref_value FROM user_prefs WHERE tenant_id = ? AND user_id = ? AND pref_key = ?`)
      .get(tenantId, userId, prefKey) as { pref_value?: string } | undefined;
    if (!row?.pref_value) {
      res.json({ success: true, data: null });
      return;
    }
    const data = JSON.parse(row.pref_value);
    res.json({ success: true, data });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/prefs/:key', (req, res) => {
  try {
    const prefKey = String(req.params.key || "");
    const tenantId = getTenantId(req);
    const userId = getUserId(req) || "anonymous";
    const now = new Date().toISOString();
    const payload = JSON.stringify(req.body ?? {});
    db.prepare(
      `INSERT INTO user_prefs (tenant_id, user_id, pref_key, pref_value, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(tenant_id, user_id, pref_key) DO UPDATE SET pref_value = excluded.pref_value, updated_at = excluded.updated_at`
    ).run(tenantId, userId, prefKey, payload, now);
    res.json({ success: true });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/providers', (req, res) => {
  if (!requirePermission(req, res, PROVIDER_PERMS.write)) return;
  try {
    const { id, name, type, status, config_json, health_status, fallback_provider_id } = req.body || {};
    const now = new Date().toISOString();
    const rowId = id && String(id).trim() ? String(id).trim() : `prov-${Date.now()}`;
    const rowName = name && String(name).trim() ? String(name).trim() : "Provider";
    const rowType = type && String(type).trim() ? String(type).trim() : "generic";
    const rowStatus = status && String(status).trim() ? String(status).trim() : "ACTIVE";
    const allowedTypes = new Set(["storage", "ocr", "messaging", "payments", "generic"]);
    const allowedStatus = new Set(["ACTIVE", "DISABLED", "EXPERIMENTAL"]);
    const allowedHealth = new Set(["OK", "WARN", "ERR", "UNKNOWN"]);
    if (!allowedTypes.has(rowType)) {
      return sendError(res, 400, "TYPE_INVALID");
    }
    if (!allowedStatus.has(rowStatus)) {
      return sendError(res, 400, "STATUS_INVALID");
    }
    let cfg = "";
    if (typeof config_json === "string") {
      try {
        JSON.parse(config_json);
        cfg = config_json;
      } catch {
        return sendError(res, 400, "INVALID_JSON", "config_json must be valid JSON string");
      }
    } else {
      cfg = JSON.stringify(config_json || {});
    }
    const health = String(health_status ?? "UNKNOWN");
    if (!allowedHealth.has(health)) {
      return sendError(res, 400, "HEALTH_INVALID");
    }
    const fallback = fallback_provider_id ? String(fallback_provider_id) : null;
    db.prepare(`INSERT INTO providers (id, name, type, status, config_json, health_status, fallback_provider_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(rowId, rowName, rowType, rowStatus, cfg, health, fallback, now);
    auditWrite(req, "PROVIDER_CREATE", "providers", { id: rowId, name: rowName, type: rowType, status: rowStatus, health_status: health, fallback_provider_id: fallback });
    res.json({ success: true, data: { id: rowId } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/providers/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PROVIDER_PERMS.write)) return;
  try {
    const { name, type, status, config_json, health_status, fallback_provider_id } = req.body || {};
    const now = new Date().toISOString();
    let cfg = "";
    if (typeof config_json === "string") {
      try {
        JSON.parse(config_json);
        cfg = config_json;
      } catch {
        return sendError(res, 400, "INVALID_JSON", "config_json must be valid JSON string");
      }
    } else {
      cfg = JSON.stringify(config_json || {});
    }
    const allowedTypes = new Set(["storage", "ocr", "messaging", "payments", "generic"]);
    const allowedStatus = new Set(["ACTIVE", "DISABLED", "EXPERIMENTAL"]);
    const allowedHealth = new Set(["OK", "WARN", "ERR", "UNKNOWN"]);
    const nextType = String(type ?? "").trim() || "generic";
    const nextStatus = String(status ?? "").trim() || "ACTIVE";
    if (!allowedTypes.has(nextType)) {
      return sendError(res, 400, "TYPE_INVALID");
    }
    if (!allowedStatus.has(nextStatus)) {
      return sendError(res, 400, "STATUS_INVALID");
    }
    const health = String(health_status ?? "UNKNOWN");
    if (!allowedHealth.has(health)) {
      return sendError(res, 400, "HEALTH_INVALID");
    }
    const fallback = fallback_provider_id ? String(fallback_provider_id) : null;
    db.prepare(`UPDATE providers SET name = ?, type = ?, status = ?, config_json = ?, health_status = ?, fallback_provider_id = ?, updated_at = ? WHERE id = ?`)
      .run(String(name ?? ""), nextType, nextStatus, cfg, health, fallback, now, id);
    auditWrite(req, "PROVIDER_UPDATE", "providers", { id, name, type, status, health_status: health, fallback_provider_id: fallback });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.delete('/api/cp/providers/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, PROVIDER_PERMS.write)) return;
  try {
    db.prepare(`DELETE FROM providers WHERE id = ?`).run(id);
    auditWrite(req, "PROVIDER_DELETE", "providers", { id });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/policies', (req, res) => {
  try {
    const rows = db.prepare(`SELECT id, name, status, updated_at FROM policies ORDER BY name ASC`).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.post('/api/cp/policies', (req, res) => {
  if (!requirePermission(req, res, POLICY_PERMS.write)) return;
  try {
    const { id, name, status } = req.body || {};
    const now = new Date().toISOString();
    const rowId = id && String(id).trim() ? String(id).trim() : `pol-${Date.now()}`;
    const rowName = name && String(name).trim() ? String(name).trim() : "Policy";
    const rowStatus = status && String(status).trim() ? String(status).trim() : "ACTIVE";
    const allowedStatus = new Set(["ACTIVE", "DISABLED", "EXPERIMENTAL"]);
    if (!allowedStatus.has(rowStatus)) {
      return sendError(res, 400, "STATUS_INVALID");
    }
    db.prepare(`INSERT INTO policies (id, name, status, updated_at) VALUES (?, ?, ?, ?)`)
      .run(rowId, rowName, rowStatus, now);
    auditWrite(req, "POLICY_CREATE", "policies", { id: rowId, name: rowName, status: rowStatus });
    res.json({ success: true, data: { id: rowId } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/policies/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, POLICY_PERMS.write)) return;
  try {
    const { name, status } = req.body || {};
    const now = new Date().toISOString();
    const rowStatus = String(status ?? "ACTIVE").trim() || "ACTIVE";
    const allowedStatus = new Set(["ACTIVE", "DISABLED", "EXPERIMENTAL"]);
    if (!allowedStatus.has(rowStatus)) {
      return sendError(res, 400, "STATUS_INVALID");
    }
    db.prepare(`UPDATE policies SET name = ?, status = ?, updated_at = ? WHERE id = ?`)
      .run(String(name ?? ""), rowStatus, now, id);
    auditWrite(req, "POLICY_UPDATE", "policies", { id, name, status: rowStatus });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.delete('/api/cp/policies/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, POLICY_PERMS.write)) return;
  try {
    db.prepare(`DELETE FROM policies WHERE id = ?`).run(id);
    auditWrite(req, "POLICY_DELETE", "policies", { id });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/security', (req, res) => {
  try {
    const rows = db.prepare(`SELECT id, name, status, updated_at FROM security_settings ORDER BY name ASC`).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/security/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, SECURITY_PERMS.write)) return;
  try {
    const { name, status } = req.body || {};
    const allowedStatuses = new Set(["ENFORCED", "ACTIVE", "SCHEDULED", "DISABLED"]);
    if (!allowedStatuses.has(String(status ?? ""))) {
      return sendError(res, 400, "STATUS_INVALID");
    }
    const now = new Date().toISOString();
    db.prepare(`UPDATE security_settings SET name = ?, status = ?, updated_at = ? WHERE id = ?`)
      .run(String(name ?? ""), String(status ?? ""), now, id);
    auditWrite(req, "SECURITY_UPDATE", "security", { id, name, status });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.delete('/api/cp/security/:id', (req, res) => {
  const { id } = req.params;
  if (!requirePermission(req, res, SECURITY_PERMS.write)) return;
  try {
    db.prepare(`DELETE FROM security_settings WHERE id = ?`).run(id);
    auditWrite(req, "SECURITY_DELETE", "security", { id });
    res.json({ success: true, data: { id } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/branding', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || "default";
  try {
    const row = db.prepare(`SELECT tenant_id, logo_url, primary_color, updated_at FROM branding_settings WHERE tenant_id = ?`).get(tenantId);
    if (!row) {
      const now = new Date().toISOString();
      db.prepare(`INSERT INTO branding_settings (tenant_id, logo_url, primary_color, updated_at) VALUES (?, ?, ?, ?)`)
        .run(tenantId, "", "#3b82f6", now);
      return res.json({ success: true, data: { tenant_id: tenantId, logo_url: "", primary_color: "#3b82f6", updated_at: now } });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/plans', (req, res) => {
  try {
    const plansPath = resolveSsotPath("TENANT_FEATURE_MATRIX.json");
    const raw = fs.readFileSync(plansPath, "utf-8");
    const json = JSON.parse(raw);
    res.json({ success: true, data: json });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/plans', (req, res) => {
  if (!requirePermission(req, res, TENANT_PERMS.write)) return;
  try {
    const payload = req.body || {};
    if (!payload || typeof payload !== "object") {
      return sendError(res, 400, "ERR_INVALID_PAYLOAD");
    }
    if (!payload.templates || typeof payload.templates !== "object") {
      return sendError(res, 400, "ERR_INVALID_TEMPLATES");
    }
    const plansPath = resolveSsotPath("TENANT_FEATURE_MATRIX.json");
    fs.writeFileSync(plansPath, JSON.stringify(payload, null, 2));
    auditWrite(req, "TENANT_MATRIX_UPDATE", "tenant_feature_matrix", { templates: Object.keys(payload.templates || {}) });
    res.json({ success: true });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.put('/api/cp/branding', (req, res) => {
  const tenantId = (req.headers['x-tenant-id'] as string) || "default";
  if (!requirePermission(req, res, BRANDING_PERMS.write)) return;
  try {
    const { logo_url, primary_color } = req.body || {};
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO branding_settings (tenant_id, logo_url, primary_color, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(tenant_id) DO UPDATE SET logo_url = excluded.logo_url, primary_color = excluded.primary_color, updated_at = excluded.updated_at`)
      .run(tenantId, String(logo_url ?? ""), String(primary_color ?? "#3b82f6"), now);
    auditWrite(req, "BRANDING_UPDATE", "branding", { tenant_id: tenantId, logo_url, primary_color });
    res.json({ success: true, data: { tenant_id: tenantId } });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/cp/settings-summary', (req, res) => {
  try {
    const tenants = db.prepare(`SELECT COUNT(*) as c FROM tenants`).get() as { c: number };
    const providers = db.prepare(`SELECT COUNT(*) as c FROM providers`).get() as { c: number };
    const policies = db.prepare(`SELECT COUNT(*) as c FROM policies`).get() as { c: number };
    const security = db.prepare(`SELECT COUNT(*) as c FROM security_settings`).get() as { c: number };

    res.json({
      success: true,
      data: {
        tenants: tenants?.c ?? 0,
        providers: providers?.c ?? 0,
        policies: policies?.c ?? 0,
        security: security?.c ?? 0,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    return sendError(res, 500, "ERR_INTERNAL", String(err));
  }
});

app.get('/api/pages/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = req.headers['x-tenant-id'] as string || 'default';
  
  try {
    // TODO: Query real page from DB
    res.json({
      id,
      tenantId,
      name: `Page ${id}`,
      content: { widgets: [] }
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
