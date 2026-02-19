/**
 * Zero-trust JWT: access + refresh tokens. HMAC-SHA256, no external deps.
 */

import crypto from "crypto";

const ALG = "HS256";
const ACCESS_TTL_SEC = Number(process.env.JWT_ACCESS_TTL_SEC) || 900;   // 15 min
const REFRESH_TTL_SEC = Number(process.env.JWT_REFRESH_TTL_SEC) || 86400 * 7; // 7 days

const SECRET_ACCESS = (process.env.JWT_SECRET_ACCESS || process.env.JWT_SECRET || "change-me-access").toString();
const SECRET_REFRESH = (process.env.JWT_SECRET_REFRESH || process.env.JWT_SECRET || "change-me-refresh").toString();

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

function sign(payload: Record<string, unknown>, secret: string, expSec: number): string {
  const header = { alg: ALG, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSec };
  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(body)));
  const toSign = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(toSign).digest();
  return `${toSign}.${base64UrlEncode(sig)}`;
}

function verify(token: string, secret: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("JWT invalid format");
  const [headerB64, payloadB64, sigB64] = parts;
  const toSign = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(toSign).digest();
  const actualSig = base64UrlDecode(sigB64);
  if (expectedSig.length !== actualSig.length || !crypto.timingSafeEqual(expectedSig, actualSig)) {
    throw new Error("JWT invalid signature");
  }
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as Record<string, unknown>;
  const exp = Number(payload.exp);
  if (!exp || Math.floor(Date.now() / 1000) > exp) throw new Error("JWT expired");
  return payload;
}

export type AccessPayload = {
  sub: string;
  role: string;
  scopes: string[];
  tid: string;
  iat?: number;
  exp?: number;
};

export type RefreshPayload = {
  sub: string;
  tid: string;
  jti: string;
  iat?: number;
  exp?: number;
};

export function signAccessToken(payload: Omit<AccessPayload, "iat" | "exp">): string {
  return sign(
    { sub: payload.sub, role: payload.role, scopes: payload.scopes ?? [], tid: payload.tid },
    SECRET_ACCESS,
    ACCESS_TTL_SEC
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  const p = verify(token, SECRET_ACCESS) as AccessPayload;
  if (!p.sub || !p.tid) throw new Error("JWT missing sub/tid");
  return {
    sub: String(p.sub),
    role: String(p.role || "USER"),
    scopes: Array.isArray(p.scopes) ? p.scopes.map(String) : [],
    tid: String(p.tid),
    iat: p.iat,
    exp: p.exp,
  };
}

export function signRefreshToken(payload: Omit<RefreshPayload, "iat" | "exp">): string {
  return sign(
    { sub: payload.sub, tid: payload.tid, jti: payload.jti },
    SECRET_REFRESH,
    REFRESH_TTL_SEC
  );
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const p = verify(token, SECRET_REFRESH) as RefreshPayload;
  if (!p.sub || !p.tid || !p.jti) throw new Error("JWT missing sub/tid/jti");
  return {
    sub: String(p.sub),
    tid: String(p.tid),
    jti: String(p.jti),
    iat: p.iat,
    exp: p.exp,
  };
}
