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
  } catch {
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
  } catch {
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
