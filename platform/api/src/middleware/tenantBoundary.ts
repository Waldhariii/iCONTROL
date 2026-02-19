import type { Request, Response, NextFunction } from "express";

/**
 * Tenant boundary: req.tenantId must already be set by authBoundary (from token tid).
 * TenantId never comes from headers. /api/health and /api/auth/* are excluded.
 */
export function tenantBoundary(req: Request, res: Response, next: NextFunction): void {
  const path = (req.path || "").replace(/^\/+/, "");
  const full = (req.originalUrl || req.url || "").split("?")[0] || "";
  if (path === "health" || path.startsWith("auth/") || full.endsWith("/health") || full.includes("/auth/")) {
    (req as Request & { tenantId?: string }).tenantId = path === "health" ? "default" : undefined;
    return next();
  }
  const tenantId = (req as Request & { tenantId?: string }).tenantId;
  if (!tenantId || String(tenantId).trim() === "") {
    res.status(400).json({ success: false, error: "Tenant context required (from token)", code: "TENANT_ID_REQUIRED" });
    return;
  }
  next();
}
