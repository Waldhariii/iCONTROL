/**
 * Auth endpoints: login (access+refresh), refresh (rotate), logout (invalidate).
 */
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import type { DB } from "../db/types";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";

export function registerAuthRoutes(app: Express, db: DB): void {
  // POST /api/auth/login — body: { username, password?, tenantId }; returns accessToken, refreshToken
  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const { username, password, tenantId: bodyTid } = req.body || {};
      const user = String(username ?? "").trim();
      const tid = String(bodyTid ?? "default").trim();
      if (!user) {
        return res.status(400).json({ success: false, error: "username required", code: "USERNAME_REQUIRED" });
      }
      // Optional: validate against users table if it exists; for now accept any user+tenant
      const role = "USER";
      const scopes = ["cp:read"];
      const jti = crypto.randomUUID();
      const accessToken = signAccessToken({ sub: user, role, scopes, tid });
      const refreshToken = signRefreshToken({ sub: user, tid, jti });
      const now = new Date().toISOString();
      const exp = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
      try {
        db.prepare(
          `INSERT INTO refresh_tokens (jti, user_id, tenant_id, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, 0, ?)`
        ).run(jti, user, tid, exp, now);
      } catch (e) {
        // table might not exist yet
      }
      res.json({ success: true, accessToken, refreshToken, expiresIn: 900 });
    } catch (e) {
      res.status(500).json({ success: false, error: String(e), code: "LOGIN_FAILED" });
    }
  });

  // POST /api/auth/refresh — body: { refreshToken }; rotate refresh + new access
  app.post("/api/auth/refresh", (req: Request, res: Response) => {
    try {
      const { refreshToken: oldRefresh } = req.body || {};
      const token = typeof oldRefresh === "string" ? oldRefresh.trim() : "";
      if (!token) {
        return res.status(400).json({ success: false, error: "refreshToken required", code: "REFRESH_TOKEN_REQUIRED" });
      }
      const payload = verifyRefreshToken(token);
      const revoked = db.prepare(`SELECT revoked FROM refresh_tokens WHERE jti = ?`).get(payload.jti) as { revoked?: number } | undefined;
      if (revoked?.revoked) {
        return res.status(401).json({ success: false, error: "Refresh token revoked", code: "REFRESH_REVOKED" });
      }
      db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE jti = ?`).run(payload.jti);
      const jtiNew = crypto.randomUUID();
      const accessToken = signAccessToken({ sub: payload.sub, role: "USER", scopes: ["cp:read"], tid: payload.tid });
      const refreshToken = signRefreshToken({ sub: payload.sub, tid: payload.tid, jti: jtiNew });
      const now = new Date().toISOString();
      const exp = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
      db.prepare(
        `INSERT INTO refresh_tokens (jti, user_id, tenant_id, expires_at, revoked, created_at) VALUES (?, ?, ?, ?, 0, ?)`
      ).run(jtiNew, payload.sub, payload.tid, exp, now);
      res.json({ success: true, accessToken, refreshToken, expiresIn: 900 });
    } catch (e) {
      res.status(401).json({ success: false, error: "Invalid or expired refresh token", code: "INVALID_REFRESH" });
    }
  });

  // POST /api/auth/logout — body: { refreshToken }; invalidate refresh
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      const { refreshToken: token } = req.body || {};
      const t = typeof token === "string" ? token.trim() : "";
      if (t) {
        try {
          const payload = verifyRefreshToken(t);
          db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE jti = ?`).run(payload.jti);
        } catch {
          // already invalid
        }
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: String(e), code: "LOGOUT_FAILED" });
    }
  });
}
