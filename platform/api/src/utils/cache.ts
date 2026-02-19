import crypto from "crypto";

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

/**
 * Get value by key. Returns undefined if missing or expired.
 */
export function get<T>(key: string): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set value with TTL in milliseconds.
 */
export function set<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Build cache key: tenant-scoped + route + params hash.
 * key = `${tenantId}:${routeId}:${paramsHash}:${scopeHash}`
 */
export function cacheKey(
  tenantId: string,
  routeId: string,
  params: Record<string, string | number | undefined> | string,
  scopeHash = ""
): string {
  const paramsStr =
    typeof params === "string"
      ? params
      : Object.keys(params)
          .sort()
          .map((k) => `${k}=${params[k]}`)
          .join("&");
  const paramsHash = crypto.createHash("sha256").update(paramsStr, "utf8").digest("hex").slice(0, 16);
  const scope = scopeHash || "default";
  return `${tenantId}:${routeId}:${paramsHash}:${scope}`;
}
