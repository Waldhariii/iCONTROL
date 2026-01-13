import { incCounter, observeHistogram } from "./metrics.registry";

type AnyRt = any;

export type CacheKey = string;
export type CacheTags = string[];

export type CacheEntry<T = any> = {
  v: T;
  exp: number;         // epoch ms
  tags: CacheTags;
  cAt: number;         // created at
};

export type CacheProvider = {
  get: <T>(key: CacheKey) => Promise<CacheEntry<T> | null>;
  set: <T>(key: CacheKey, entry: CacheEntry<T>) => Promise<void>;
  del: (key: CacheKey) => Promise<void>;
  keysByTag: (tag: string) => Promise<string[]>;
  addKeyToTag: (tag: string, key: string) => Promise<void>;
  removeKeyFromTag: (tag: string, key: string) => Promise<void>;
  clear: () => Promise<void>;
};

function now(): number {
  return Date.now();
}

function ensure(rt: AnyRt) {
  if (!rt) return null;
  if (!rt.__CACHE__) rt.__CACHE__ = Object.create(null);
  if (!rt.__CACHE_TAGS__) rt.__CACHE_TAGS__ = Object.create(null);
  return rt;
}

function inMemProvider(rt: AnyRt): CacheProvider {
  const base = ensure(rt) as any;
  const map: Record<string, CacheEntry<any>> = base.__CACHE__;
  const tagMap: Record<string, Record<string, 1>> = base.__CACHE_TAGS__;

  return {
    get: async (key) => (map[key] ? map[key] : null),
    set: async (key, entry) => { map[key] = entry; },
    del: async (key) => { delete map[key]; },
    keysByTag: async (tag) => Object.keys(tagMap[tag] || {}),
    addKeyToTag: async (tag, key) => {
      if (!tagMap[tag]) tagMap[tag] = Object.create(null);
      tagMap[tag][key] = 1;
    },
    removeKeyFromTag: async (tag, key) => {
      if (!tagMap[tag]) return;
      delete tagMap[tag][key];
      if (Object.keys(tagMap[tag]).length === 0) delete tagMap[tag];
    },
    clear: async () => {
      for (const k of Object.keys(map)) delete map[k];
      for (const t of Object.keys(tagMap)) delete tagMap[t];
    },
  };
}

/**
 * Dormant subscription point:
 * - Core: in-memory provider (always available)
 * - Premium: rt.__CACHE_PROVIDER__ can be injected (Redis/etc.)
 *   If present, it owns cache operations only; core keeps rest.
 */
export function getCacheProvider(rt: AnyRt): CacheProvider {
  const r = ensure(rt) as any;
  if (!r) return inMemProvider({} as any); // should never be used, but keeps contract non-throw
  const p = r.__CACHE_PROVIDER__ as CacheProvider | undefined;
  return p || inMemProvider(r);
}

export async function cacheGet<T>(rt: AnyRt, key: CacheKey): Promise<T | null> {
  const t0 = now();
  try {
    const p = getCacheProvider(rt);
    const e = await p.get<T>(key);
    if (!e) {
      try { incCounter(rt, "cache.get.count", 1, { outcome: "miss" }); } catch (err) {}
      return null;
    }
    if (e.exp > 0 && now() > e.exp) {
      await cacheDel(rt, key, e.tags);
      try { incCounter(rt, "cache.get.count", 1, { outcome: "expired" }); } catch {}
      return null;
    }
    try { incCounter(rt, "cache.get.count", 1, { outcome: "hit" }); } catch {}
    return e.v as T;
  } finally {
    try { observeHistogram(rt, "cache.get.latency_ms", now() - t0, {}); } catch {}
  }
}

export async function cacheSet<T>(
  rt: AnyRt,
  key: CacheKey,
  value: T,
  opts?: { ttlMs?: number; tags?: CacheTags }
): Promise<void> {
  const t0 = now();
  const ttl = Math.max(0, opts?.ttlMs || 0);
  const exp = ttl > 0 ? now() + ttl : 0;
  const tags = (opts?.tags || []).filter(Boolean);

  const entry: CacheEntry<T> = { v: value, exp, tags, cAt: now() };

  try {
    const p = getCacheProvider(rt);
    await p.set(key, entry);

    for (const tag of tags) {
      await p.addKeyToTag(tag, key);
    }

    try { incCounter(rt, "cache.set.count", 1, { outcome: "ok" }); } catch {}
  } catch (err) {
try { incCounter(rt, "cache.set.count", 1, { outcome: "fail" }); } catch {}
    throw err;
  } finally {
    try { observeHistogram(rt, "cache.set.latency_ms", now() - t0, {}); } catch (err) {}
  }
}

export async function cacheDel(rt: AnyRt, key: CacheKey, tagsHint?: CacheTags): Promise<void> {
  const p = getCacheProvider(rt);
  const tags = (tagsHint || []);
  try {
    await p.del(key);
    for (const tag of tags) {
      await p.removeKeyFromTag(tag, key);
    }
    try { incCounter(rt, "cache.del.count", 1, { outcome: "ok" }); } catch {}
  } catch (err) {
try { incCounter(rt, "cache.del.count", 1, { outcome: "fail" }); } catch {}
    throw err;
  }
}

export async function cacheInvalidateTag(rt: AnyRt, tag: string): Promise<number> {
  const t0 = now();
  const p = getCacheProvider(rt);
  const keys = await p.keysByTag(tag);

  let n = 0;
  for (const k of keys) {
    const e = await p.get(k);
    await cacheDel(rt, k, e?.tags || [tag]);
    n += 1;
  }

  try { incCounter(rt, "cache.invalidate.count", 1, { tag }); } catch {}
  try { observeHistogram(rt, "cache.invalidate.latency_ms", now() - t0, { tag }); } catch {}
  return n;
}

export async function cacheClear(rt: AnyRt): Promise<void> {
  const p = getCacheProvider(rt);
  await p.clear();
  try { incCounter(rt, "cache.clear.count", 1, { outcome: "ok" }); } catch {}
}


// ------------------------------
// Enterprise extensions: single-flight + refresh-aside + LRU bound

type __CacheRawEntry = any;

// Provider-raw read: bypasses cacheGet() purge; reads entry directly from provider store.
// Works for inMemProvider() and premium __CACHE_PROVIDER__.
async function __cacheRawGetEntry(rt: any, key: string): Promise<any | null> {
  try {
    const p = getCacheProvider(rt as any);
    const e = await p.get(key);
    return e || null;
  } catch {
    return null;
  }
}

// Normalize entry shape to what SWR needs.
function __cacheExtract(raw: any): { value: any; expiresAt: number } | null {
  if (!raw) return null;

  // Canonical CacheEntry: { v, exp, tags, cAt }
  if (typeof raw === "object" && "v" in raw) {
    const exp = typeof (raw as any).exp === "number" ? (raw as any).exp : 0;
    return { value: (raw as any).v, expiresAt: exp };
  }

  // Fallback shapes (best-effort)
  if (typeof raw === "object" && "value" in raw) {
    const exp = typeof (raw as any).exp === "number" ? (raw as any).exp : (typeof (raw as any).expiresAt === "number" ? (raw as any).expiresAt : 0);
    return { value: (raw as any).value, expiresAt: exp };
  }

  return { value: raw, expiresAt: 0 };
}

// ------------------------------

export type CacheComputeOptions = {
  ttlMs: number;
  tags?: string[];
  // If set: when expired but within stale window, return stale immediately and refresh in background.
  staleWhileRevalidateMs?: number;
  // If set: cap in-memory entries (LRU eviction). No-op for external provider until wired.
  maxEntries?: number;
};

function getInflight(rt: any): Map<string, Promise<any>> {
  const w: any = rt || ({} as any);
  if (!w.__CACHE_INFLIGHT__) w.__CACHE_INFLIGHT__ = new Map<string, Promise<any>>();
  return w.__CACHE_INFLIGHT__;
}

// LRU implemented via Map insertion order:
// - touch = delete + set (moves key to end => MRU)
// - evict = first key in map => LRU
function getLRU(rt: any): Map<string, true> {
  const w: any = rt || ({} as any);
  if (!w.__CACHE_LRU__) w.__CACHE_LRU__ = new Map<string, true>();
  return w.__CACHE_LRU__;
}

function lruTouch(rt: any, key: string) {
  try {
    const lru = getLRU(rt);
    if (lru.has(key)) lru.delete(key);
    lru.set(key, true);
  } catch {}
}

function inMemoryStore(rt: any): Map<string, any> | null {
  try {
    const w: any = rt || {};
    const store = w.__CACHE_STORE__ as Map<string, any> | undefined;
    return store || null;
  } catch {
    return null;
  }
}

function lruEvictIfNeeded(rt: any, maxEntries?: number) {
  try {
    const max = Math.max(0, maxEntries || 0);
    if (!max) return;

    const lru = getLRU(rt);
    while (lru.size > max) {
      const first = lru.keys().next();
      if (first.done) break;
      const k = first.value as string;

      // remove from LRU first to avoid loops
      try { lru.delete(k); } catch {}

      // real eviction from provider-backed cache
      try { cacheDel(rt as any, k as any); } catch {}
      try { incCounter(rt, "cache.lru.evict.count", 1, {}); } catch {}
    }
  } catch {}
}

async function computeAndSet(rt: any, key: string, compute: () => Promise<any> | any, opts: CacheComputeOptions) {
  const t0 = now();
  try {
    const v = await compute();
    await cacheSet(rt, key, v, { ttlMs: opts.ttlMs, tags: opts.tags || [] });
    lruTouch(rt, key);
    lruEvictIfNeeded(rt, opts.maxEntries);
    try { incCounter(rt, "cache.compute.count", 1, { outcome: "ok" }); } catch {}
    return v;
  } catch (err) {
    try { incCounter(rt, "cache.compute.count", 1, { outcome: "fail" }); } catch {}
    throw err;
  } finally {
    try { observeHistogram(rt, "cache.compute.latency_ms", now() - t0, {}); } catch {}
  }
}

// Returns cached value when present; otherwise computes and caches.
// If staleWhileRevalidateMs is provided:
// - if entry is expired but still within stale window, returns stale immediately and triggers background refresh.
export async function cacheGetOrCompute(
  rt: any,
  key: string,
  compute: () => Promise<any> | any,
  opts: CacheComputeOptions
) {
  // Provider-first logic (SWR-safe): do NOT call cacheGet() first when SWR is enabled,
  // because cacheGet() deletes expired entries, making stale serving impossible.
  const swr = Math.max(0, opts?.staleWhileRevalidateMs || 0);

  // 1) provider read (raw entry)
  try {
    const p = getCacheProvider(rt as any);
    const e: any = await p.get(key as any);

    if (e) {
      const exp = typeof e.exp === "number" ? e.exp : 0;
      const isExpired = exp > 0 && now() > exp;

      // 1a) hit (not expired)
      if (!isExpired) {
        try { incCounter(rt, "cache.get.count", 1, { outcome: "hit" }); } catch {}
        try { lruTouch(rt, key); } catch {}
        return e.v;
      }

      // 1b) expired: SWR serve-stale window
      if (swr > 0) {
        const agePastExpiry = now() - exp;
        if (agePastExpiry > 0 && agePastExpiry <= swr) {
          try { incCounter(rt, "cache.refresh_aside.count", 1, { action: "serve_stale" }); } catch {}

    // SWR kill-switch: allow runtime to force recompute path (no stale serving)
    if ((rt as any)?.__CACHE_SWR_DISABLED__ === true) {
      try { incCounter(rt, "cache.refresh_aside.count", 1, { action: "disabled" }); } catch {}
      throw new Error("SWR_DISABLED"); // handled by outer best-effort try/catch; falls through to compute
    }
          try { lruTouch(rt, key); } catch {}

          // background refresh (best-effort single-flight)
          const inflight = getInflight(rt);
          if (!inflight.has(key)) {
            const pp = (async () => {
              try {
                return await computeAndSet(rt, key, compute, opts);
              } finally {
                inflight.delete(key);
              }
            })();
            inflight.set(key, pp);
          } else {
            try { incCounter(rt, "cache.compute.dedup.count", 1, { reason: "refresh_aside" }); } catch {}
          }

          return e.v;
        }
      }

      // 1c) expired and outside SWR: delete then fall through to compute
      try {
        await cacheDel(rt as any, key as any, (e.tags || []) as any);
      } catch {}
      try { incCounter(rt, "cache.get.count", 1, { outcome: "expired" }); } catch {}
    } else {
      try { incCounter(rt, "cache.get.count", 1, { outcome: "miss" }); } catch {}
    }
  } catch {
    // best-effort only; fall through to compute
  }

  // 2) compute (synchronous path)
  return computeAndSet(rt, key, compute, opts);
}

// Same as cacheGetOrCompute, but with single-flight to dedupe concurrent computes per key. to dedupe concurrent computes per key.
export async function cacheGetOrComputeSingleFlight(
  rt: any,
  key: string,
  compute: () => Promise<any> | any,
  opts: CacheComputeOptions
) {
  const existing = await cacheGet(rt, key);
  if (existing !== null && existing !== undefined) {
    lruTouch(rt, key);
    return existing;
  }

  const inflight = getInflight(rt);
  if (inflight.has(key)) {
    try { incCounter(rt, "cache.compute.dedup.count", 1, { reason: "singleflight" }); } catch {}
    return inflight.get(key)!;
  }

  const p = (async () => {
    try {
      return await cacheGetOrCompute(rt, key, compute, opts);
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}
