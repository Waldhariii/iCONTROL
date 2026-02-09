import type { Request, Response, NextFunction } from "express";
import { ensureTenant } from "../db/tenantRepo";
import { writeAudit } from "../db/auditRepo";
import type { DB } from "../db/types";

export type TenantCtx = {
  tenantId: string;
  tenantPlan: string;
};

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantCtx;
      userId?: string; // optional; can be set by auth later
    }
  }
}

function pickTenantId(req: Request): string | null {
  const h = (req.header("X-Tenant-ID") || req.header("x-tenant-id") || "").trim();
  const q = (typeof (req.query as any).tenantId === "string" ? String((req.query as any).tenantId) : "").trim();
  return (h || q) ? (h || q) : null;
}

export function tenantBoundary(db: DB) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantId = pickTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: "ERR_TENANT_REQUIRED", message: "Missing X-Tenant-ID or tenantId query param" });
    }

    try {
      const t = ensureTenant(db, tenantId);
      req.tenant = { tenantId: t.id, tenantPlan: t.plan };

      writeAudit(db, {
        tenantId: t.id,
        userId: req.userId ?? null,
        action: "TENANT_BOUNDARY_OK",
        resourceType: "tenant",
        metadata: { path: req.path, method: req.method }
      });

      return next();
    } catch (e: any) {
      try {
        writeAudit(db, {
          tenantId,
          userId: req.userId ?? null,
          action: "TENANT_BOUNDARY_REJECT",
          resourceType: "tenant",
          metadata: { path: req.path, method: req.method, code: e?.code ?? "ERR" }
        });
      } catch {}

      return res.status(404).json({ error: e?.code ?? "ERR_TENANT_NOT_FOUND", message: String(e?.message ?? e) });
    }
  };
}
