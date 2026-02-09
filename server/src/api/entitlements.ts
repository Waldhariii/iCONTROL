import type { Request, Response } from "express";

export function getMyEntitlements(req: Request, res: Response) {
  const tenantId = String(req.header("X-Tenant-ID") || req.query.tenantId || "default");
  const userId = "local_user";

  const capabilities =
    tenantId === "default"
      ? ["VIEW_DASHBOARD", "VIEW_SETTINGS", "VIEW_CLIENTS", "VIEW_JOBS"]
      : ["VIEW_DASHBOARD", "VIEW_SETTINGS"];

  res.json({
    tenantId,
    userId,
    role: "tenant_admin",
    capabilities,
    ttlSec: 3600,
  });
}
