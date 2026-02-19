import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Compute ETag from response body (hash).
 */
export function etagFromBody(body: unknown): string {
  const str = typeof body === "string" ? body : JSON.stringify(body);
  return crypto.createHash("sha256").update(str, "utf8").digest("hex").slice(0, 24);
}

/**
 * Normalize If-None-Match header: may be "etag" or W/"etag" or multiple.
 */
function parseIfNoneMatch(header: string | undefined): string[] {
  if (!header || typeof header !== "string") return [];
  return header
    .split(",")
    .map((s) => s.trim().replace(/^W\//i, "").replace(/^"/, "").replace(/"$/, ""));
}

/**
 * ETag middleware: compute ETag from response body, set header, and return 304 if If-None-Match matches.
 * Apply only to GET read-heavy routes. Patches res.json for this request.
 */
export function etagMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown): Response {
    const etag = etagFromBody(body);
    const quoted = `"${etag}"`;
    res.setHeader("ETag", quoted);
    const ifNoneMatch = parseIfNoneMatch(req.headers["if-none-match"]);
    if (ifNoneMatch.some((v) => v === etag || v === quoted)) {
      res.status(304);
      return res.end();
    }
    return originalJson(body);
  };
  next();
}
