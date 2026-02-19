import type { Request } from "express";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Parse limit from query: default=50, max=200.
 */
export function parseLimit(req: Request, defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT): number {
  const raw = req.query?.limit;
  if (raw === undefined || raw === "") return defaultLimit;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return defaultLimit;
  return Math.min(Math.floor(n), maxLimit);
}

/**
 * Parse id-based cursor from query (string or number).
 */
export function parseCursor(req: Request): string | number | null {
  const raw = req.query?.cursor;
  if (raw === undefined || raw === "" || raw === null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return null;
  const asNum = Number(s);
  if (Number.isFinite(asNum) && String(asNum) === s) return asNum;
  return s;
}

export interface PageMeta {
  nextCursor: string | number | null;
  hasMore: boolean;
  limit: number;
}

/**
 * Build page object for contract: { nextCursor, hasMore, limit }.
 */
export function buildPage(nextCursor: string | number | null, hasMore: boolean, limit: number): PageMeta {
  return {
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
    limit,
  };
}
