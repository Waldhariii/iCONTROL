import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt";

const ALLOWED_ROLES = new Set(["USER", "ADMIN", "SYSADMIN", "DEVELOPER"]);
const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

export type AuthRequest = Request & {
  userId?: string;
  userRole?: string;
  scopes?: string[];
  tenantId?: string;
};

/**
 * Zero-trust auth: Authorization Bearer <accessToken> required.
 * Sets req.userId, req.userRole, req.scopes, req.tenantId from token (tid).
 * /api/health and /api/auth/* are skipped (no token required).
 * If no Bearer and DEV_MODE: fallback to legacy headers and log AUTH_HEADER_COMPAT_USED.
 */
export function authBoundary(req: Request, res: Response, next: NextFunction): void {
  const path = (req.path || "").replace(/^\/+/, "");
  const full = (req.originalUrl || req.url || "").split("?")[0] || "";
  if (path === "health" || path.startsWith("auth/") || full.endsWith("/health") || full.includes("/auth/")) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const bearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (bearer) {
    try {
      const payload = verifyAccessToken(bearer);
      (req as AuthRequest).userId = payload.sub;
      (req as AuthRequest).userRole = payload.role;
      (req as AuthRequest).scopes = payload.scopes ?? [];
      (req as AuthRequest).tenantId = payload.tid;
      return next();
    } catch (e) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
      return;
    }
  }

  if (DEV_MODE) {
    const rawRole = String(req.headers["x-user-role"] || "USER").toUpperCase().trim();
    const role = ALLOWED_ROLES.has(rawRole) ? rawRole : "USER";
    const userId = String(req.headers["x-user-id"] ?? "").trim();
    const tenantId = String(req.headers["x-tenant-id"] ?? "default").trim();
    const perms = String(req.headers["x-user-permissions"] ?? "");
    const scopes = perms.split(",").map((p) => p.trim()).filter(Boolean);
    console.warn("AUTH_HEADER_COMPAT_USED");
    (req as AuthRequest).userId = userId || "dev-user";
    (req as AuthRequest).userRole = role;
    (req as AuthRequest).scopes = scopes.length ? scopes : ["cp:read"];
    (req as AuthRequest).tenantId = tenantId || "default";
    return next();
  }

  res.status(401).json({
    success: false,
    error: "Authorization required",
    code: "AUTH_REQUIRED",
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = (req as AuthRequest).userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Authentication required", code: "AUTH_REQUIRED" });
    return;
  }
  next();
}
