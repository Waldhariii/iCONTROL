import { incCounter, observeHistogram } from "./metrics.registry";

/** ICONTROL_CACHE_REGISTRY_DEANY_V1
 * Objectif: éliminer `any`/`as unknown` sans changer le comportement runtime.
 * Approche: `unknown` + narrowing + typed bags (Record<string, unknown>).
 */
type Bag = Record<string, unknown>;
type MetricsBag = Bag & { __METRICS_DISABLED__?: boolean };
type CacheBag = Bag & {
  __CACHE__?: Record<string, unknown>;
  __CACHE_TAGS__?: Record<string, Record<string, 1>>;
  __CACHE_PROVIDER__?: unknown;
  __CACHE_SWR_DISABLED__?: boolean;
  __CACHE_AUDIT__?: unknown;
};
const asBag = <T extends Bag>(v: unknown): T => (v as T);



/** ICONTROL_CACHE_REGISTRY_TYPED_BAG_V1
 * Goal: reduce `any` by centralizing runtime typing + narrowing at boundaries.
 * Strategy: store cache state on rt via a typed bag (no `any`), use `unknown` for raw/provider payloads.
 */
type UnknownRecord = Record<string, unknown>;

type RtCacheBag = AnyRt & {
  __CACHE__?: Record<string, CacheEntry<unknown>>;
  __CACHE_TAGS__?: Record<string, Record<string, 1>>;
  __CACHE_PROVIDER__?: CacheProvider;

  __CACHE_INFLIGHT__?: Map<string, Promise<unknown>>;
  __CACHE_SWR_META__?: Map<string, number>;
  __CACHE_LRU__?: Map<string, true>;

  __METRICS_DISABLED__?: boolean;
  __CACHE_SWR_DISABLED__?: boolean;
};

function _asBag(rt: AnyRt): RtCacheBag {
  return rt as RtCacheBag;
}

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

// ================= HARD_CLAMP_CACHE_BOUNDS =================
// Défense contre configurations toxiques (runtime / caller)

function clampPositiveInt(v: unknown, def: number, max?: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return def;
  if (max !== undefined && v > max) return max;
  return Math.floor(v);
}

function clampCacheOpts(opts: unknown) {
  if (!opts || typeof opts !== "object") return opts || {};

  // TTL: minimum 1ms, maximum 24h
  opts.ttlMs = clampPositiveInt(opts.ttlMs, 0, 86_400_000);

  // SWR: jamais négatif, jamais > TTL*10 (borne défensive)
  if (typeof opts.staleWhileRevalidateMs === "number") {
    const maxSWR = opts.ttlMs > 0 ? opts.ttlMs * 10 : 0;
    opts.staleWhileRevalidateMs = clampPositiveInt(
      opts.staleWhileRevalidateMs,
      0,
      maxSWR
    );
  }

  // maxEntries: minimum 1, maximum 100k (évite OOM)
  if (typeof opts.maxEntries === "number") {
    opts.maxEntries = clampPositiveInt(opts.maxEntries, 1, 100_000);
  }

  return opts;
}
// ===========================================================


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
  const base = _asBag(ensure(rt));
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
  const r = _asBag(ensure(rt));
  if (!r) return inMemProvider(_asBag({} as AnyRt)); // should never be used, but keeps contract non-throw
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


// Meta-marker TTL (best-effort) to avoid unbounded growth
const __CACHE_REFRESH_ASIDE_META_TTL_MS = 2000;
// ------------------------------
// Enterprise extensions: single-flight + refresh-aside + LRU bound

type __CacheRawEntry = unknown;

function __deferMicrotask(fn: () => void) {
  try {
    // queueMicrotask is preferred when available (deterministic, no macro-tick jitter)
    typeof queueMicrotask === "function" ? queueMicrotask(fn) : Promise.resolve().then(fn);
  } catch {
    try { Promise.resolve().then(fn); } catch {}
  }
}

/** Metrics helpers (best-effort, respects rt.__METRICS_DISABLED__) */
function __nowMs(): number {
  return Date.now();
}

function __mInc(rt: AnyRt, name: string, by = 1, tags: Record<string, string> | undefined = {}) {
  try {
    if (_asBag(rt).__METRICS_DISABLED__) return;
    incCounter(rt, name, by, tags || {});
  } catch {}
}

function __mHist(rt: AnyRt, name: string, v: number, tags: Record<string, string> | undefined = {}) {
  try {
    if (_asBag(rt).__METRICS_DISABLED__) return;
    observeHistogram(rt, name, v, tags || {});
  } catch {}
}

// Provider-raw read: bypasses cacheGet() purge; reads entry directly from provider store.
// Works for inMemProvider() and premium __CACHE_PROVIDER__.
async function __cacheRawGetEntry(rt: AnyRt, key: string): Promise<unknown | null> {
  try {
    const p = getCacheProvider(rt as unknown);
    const e = await p.get(key);
    return e || null;
  } catch {
    return null;
  }
}

// Normalize entry shape to what SWR needs.
function __cacheExtract(raw: unknown): { value: unknown; expiresAt: number } | null {
  if (!raw) return null;

  // Canonical CacheEntry: { v, exp, tags, cAt }
  if (typeof raw === "object" && "v" in raw) {
    const exp = typeof (raw as unknown).exp === "number" ? (raw as unknown).exp : 0;
    return { value: (raw as unknown).v, expiresAt: exp };
  }

  // Fallback shapes (best-effort)
  if (typeof raw === "object" && "value" in raw) {
    const exp = typeof (raw as unknown).exp === "number" ? (raw as unknown).exp : (typeof (raw as unknown).expiresAt === "number" ? (raw as unknown).expiresAt : 0);
    return { value: (raw as unknown).value, expiresAt: exp };
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


function __clampMaxEntries(n?: number): number {
  const raw = typeof n === "number" ? n : 0;
  const v = Math.max(0, raw);
  // hard safety cap (keeps runtime stable even if caller misconfigures)
  return Math.min(v, 10000);
}

function __clampSWRMs(n?: number): number {
  const raw = typeof n === "number" ? n : 0;
  const v = Math.max(0, raw);
  // hard safety cap (7 days) to avoid stale serving forever via misconfig
  return Math.min(v, 7 * 24 * 60 * 60 * 1000);
}
function getInflight(rt: AnyRt): Map<string, Promise<unknown>> {
  const w = _asBag(rt ?? ({} as AnyRt));
  if (!w.__CACHE_INFLIGHT__) w.__CACHE_INFLIGHT__ = new Map<string, Promise<unknown>>();
  return w.__CACHE_INFLIGHT__;
}

function getRefreshAsideMeta(rt: AnyRt): Map<string, number> {
const w = _asBag(rt ?? ({} as AnyRt));
  if (!w.__CACHE_REFRESH_ASIDE_META__) w.__CACHE_REFRESH_ASIDE_META__ = new Map<string, number>();
  // Opportunistic purge (best-effort): bound growth even if timers don't run
  try {
    const meta = w.__CACHE_REFRESH_ASIDE_META__ as Map<string, number>;
    const t = now();
    for (const [k, ts] of meta.entries()) {
      if (!ts || t - ts > __CACHE_REFRESH_ASIDE_META_TTL_MS) {
        try { meta.delete(k); } catch {}
      }
    }
  } catch {}
  return w.__CACHE_REFRESH_ASIDE_META__;
}

// LRU implemented via Map insertion order:
// - touch = delete + set (moves key to end => MRU)
// - evict = first key in map => LRU
function getLRU(rt: AnyRt): Map<string, true> {
  const w = _asBag(rt ?? ({} as AnyRt));
  if (!w.__CACHE_LRU__) w.__CACHE_LRU__ = new Map<string, true>();
  return w.__CACHE_LRU__;
}

function lruTouch(rt: AnyRt, key: string) {
  try {
    const lru = getLRU(rt);
    if (lru.has(key)) lru.delete(key);
    lru.set(key, true);
  } catch {}
}

function inMemoryStore(rt: AnyRt): Map<string, any> | null {
  try {
    const w = _asBag(rt ?? ({} as AnyRt));
    const store = w.__CACHE_STORE__ as Map<string, any> | undefined;
    return store || null;
  } catch {
    return null;
  }
}

function lruEvictIfNeeded(rt: unknown, maxEntries?: number) {

  try {
    const w = _asBag(rt ?? ({} as AnyRt));
    if (w.__CACHE_LRU_DISABLED__) return;
  } catch {}

  try {
    const max = __clampMaxEntries(maxEntries);
    if (!max) return;

    const lru = getLRU(rt);
    while (lru.size > max) {
      const first = lru.keys().next();
      if (first.done) break;
      const k = first.value as string;

      // remove from LRU first to avoid loops
      try { lru.delete(k); } catch {}

      // real eviction from provider-backed cache
      try { cacheDel(rt as unknown, k as unknown); } catch {}
      try { incCounter(rt, "cache.lru.evict.count", 1, {}); } catch {}
    }
  } catch {}
}

async function computeAndSet(rt: unknown, key: string, compute: () => Promise<unknown> | unknown, opts: CacheComputeOptions) {
  const t0 = now();
  try {
    const v = await compute();
    await cacheSet(rt, key, v, { ttlMs: opts.ttlMs, tags: opts.tags || [] });
    lruTouch(rt, key);
    lruEvictIfNeeded(rt, __clampMaxEntries(opts.maxEntries));
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

function __cacheAuditMark(rt: unknown) {
  try {
    const w = _asBag(rt ?? ({} as AnyRt));
    if (!w.__cacheAudit) w.__cacheAudit = Object.create(null);
    w.__cacheAudit.swrDisabled = (w.__CACHE_SWR_DISABLED__ === true);
    w.__cacheAudit.metricsDisabled = (w.__METRICS_DISABLED__ === true);
    w.__cacheAudit.ts = Date.now();
    // P1.4 guarantee: snapshot() always present + runtime exposure (best-effort)

      // P1.7 hardening: redactedSnapshot() + stable keys (JSON-safe) (best-effort)
      try {
        const a = w.__cacheAudit;

        // Helper: recursively redact likely sensitive keys, enforce bounded shapes
        const __redact = (input: unknown): any => {
          try {
            const SENSITIVE = /pass|pwd|token|secret|auth|cookie|session|key|bearer|apikey|api_key/i;
            const MAX_STR = 256;
            const MAX_ARR = 50;
            const MAX_KEYS = 200;

            const seen = new WeakSet();
            const walk = (v: unknown, depth: number): any => {
              if (depth > 6) return "[DEPTH_LIMIT]";
              if (v == null) return v;
              const t = typeof v;
              if (t === "function") return undefined;
              if (t === "string") return v.length > MAX_STR ? v.slice(0, MAX_STR) + "…" : v;
              if (t === "number" || t === "boolean") return v;
              if (t !== "object") return String(v);

              if (seen.has(v)) return "[CYCLE]";
              seen.add(v);

              if (Array.isArray(v)) return v.slice(0, MAX_ARR).map(x => walk(x, depth + 1));

              const out: Record<string, unknown> = {};
              const keys = Object.keys(v).slice(0, MAX_KEYS);
              for (const k of keys) {
                if (SENSITIVE.test(k)) { out[k] = "[REDACTED]"; continue; }
                const vv = (v as unknown)[k];
                const wv = walk(vv, depth + 1);
                if (typeof wv !== "undefined") out[k] = wv;
              }
              return out;
            };

            return walk(input, 0);
          } catch {
            return { err: "REDACTION_FAILED" };
          }
        };

        // Stable-key snapshot: always include known keys with defaults
        const __stable = (snap: unknown) => ({
          schemaVersion: typeof snap?.schemaVersion === "number" ? snap.schemaVersion : 1,
          ts: typeof snap?.ts === "number" ? snap.ts : Date.now(),
          swrDisabled: typeof snap?.swrDisabled === "boolean" ? snap.swrDisabled : false,
          metricsDisabled: typeof snap?.metricsDisabled === "boolean" ? snap.metricsDisabled : false,
        });

        if (typeof a.redactedSnapshot !== "function") {
          a.redactedSnapshot = () => {
            const base = typeof a.snapshot === "function" ? a.snapshot() : {};
            const stable = __stable(base);
            // keep "stable keys" top-level; attach redacted "extra" under a single bucket
            const extra = __redact(base);
            return { ...stable, extra };
          };
        }
      } catch {}
    try {
      const a = w.__cacheAudit;
      // Ensure stable schema defaults before snapshot
      if (typeof a.schemaVersion !== "number") a.schemaVersion = 1;

      // Always provide JSON-safe snapshot() helper
      if (typeof a.snapshot !== "function") {
        a.snapshot = () => ({
          schemaVersion: a.schemaVersion,
          ts: a.ts,
          swrDisabled: a.swrDisabled,
          metricsDisabled: a.metricsDisabled,
        });
      }

      // Expose audit surface on runtime object (no global dependency in tests/diagnostics)
      if (rt && typeof rt === "object") rt.__cacheAudit = a;
    } catch {}

    // optional schema version for future evolution
    if (typeof w.__cacheAudit.schemaVersion !== "number") w.__cacheAudit.schemaVersion = 1;
  } catch {}
}

export async function cacheGetOrCompute(
  rt: unknown,
  key: string,
  compute: () => Promise<unknown> | unknown,
  opts: CacheComputeOptions
) {
  __cacheAuditMark(rt);

  // Provider-first logic (SWR-safe): do NOT call cacheGet() first when SWR is enabled,
  // because cacheGet() deletes expired entries, making stale serving impossible.
  const swr = __clampSWRMs(opts.staleWhileRevalidateMs);

  // 1) provider read (raw entry)
  try {
    const p = getCacheProvider(rt as unknown);
    const e: unknown = await p.get(key as unknown);

    if (e) {
      const exp = typeof e.exp === "number" ? e.exp : 0;
      const isExpired = exp > 0 && now() > exp;

      // 1a) hit (not expired)
      if (!isExpired) {
        try { incCounter(rt, "cache.get.count", 1, { outcome: "hit" }); } catch {}
        try { lruTouch(rt, key); } catch {}
        if (swr > 0) {
          try {
            const meta = getRefreshAsideMeta(rt);
            const ts = meta.get(key);
            if (ts && now() - ts <= swr) {
              __mInc(rt, "cache.refresh.dedup", 1, { reason: "refresh_aside" });
              try { meta.delete(key); } catch {}
            }
          } catch {}
        }
        return e.v;
      }

      // 1b) expired: SWR serve-stale window
      if (swr > 0) {
        const agePastExpiry = now() - exp;
        if (agePastExpiry > 0 && agePastExpiry <= swr) {
          // SWR kill-switch: force recompute path (no stale serving)
          if (_asBag(rt).__CACHE_SWR_DISABLED__ === true) {
            try { incCounter(rt, "cache.refresh_aside.count", 1, { action: "disabled" }); } catch {}
            throw new Error("SWR_DISABLED");
          }

          // serve stale immediately
          try { incCounter(rt, "cache.refresh_aside.count", 1, { action: "serve_stale" }); } catch {}
          try { lruTouch(rt, key); } catch {}

          // background refresh (best-effort single-flight)
          const inflight = getInflight(rt);
          if (!inflight.has(key)) {
            try {
              const meta = getRefreshAsideMeta(rt);
              meta.set(key, now());
              setTimeout(() => { try { meta.delete(key); } catch {} }, Math.min(swr, __CACHE_REFRESH_ASIDE_META_TTL_MS));
            } catch {}
            __mInc(rt, "cache.refresh.triggered", 1, { reason: "refresh_aside" });
            const __tR = __nowMs();

            const pp = (async () => {
              try {
                const __v = await computeAndSet(rt, key, compute, opts);
                __mInc(rt, "cache.refresh.success", 1, { reason: "refresh_aside" });
                return __v;
              } catch (e) {
                __mInc(rt, "cache.refresh.fail", 1, { reason: "refresh_aside" });
                throw e;
              } finally {
                try { __deferMicrotask(() => { try { inflight.delete(key); } catch {} }); } catch {}
                  __mHist(rt, "cache.refresh.latency_ms", __nowMs() - __tR, { reason: "refresh_aside" });
              }
            })();

            inflight.set(key, pp);
          } else {
            __mInc(rt, "cache.refresh.dedup", 1, { reason: "refresh_aside" });
            try { incCounter(rt, "cache.compute.dedup.count", 1, { reason: "refresh_aside" }); } catch {}
          }

          return e.v;
        }
      }

      // 1c) expired and outside SWR: delete then fall through to compute
      try {
        await cacheDel(rt as unknown, key as unknown, (e.tags || []) as unknown);
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
  rt: unknown,
  key: string,
  compute: () => Promise<unknown> | unknown,
  opts: CacheComputeOptions
) {
  __cacheAuditMark(rt);

  const swr = __clampSWRMs(opts.staleWhileRevalidateMs);
  if (swr > 0) {
    const raw = await __cacheRawGetEntry(rt, key);
    const entry = __cacheExtract(raw);
    if (entry) {
      const exp = typeof entry.expiresAt === "number" ? entry.expiresAt : 0;
      const isExpired = exp > 0 && now() > exp;

      if (!isExpired) {
        try { incCounter(rt, "cache.get.count", 1, { outcome: "hit" }); } catch {}
        lruTouch(rt, key);
        if (swr > 0) {
          try {
            const meta = getRefreshAsideMeta(rt);
            const ts = meta.get(key);
            if (ts && now() - ts <= swr) {
              __mInc(rt, "cache.refresh.dedup", 1, { reason: "refresh_aside" });
              try { meta.delete(key); } catch {}
            }
          } catch {}
        }
        return entry.value;
      }

      if (exp > 0) {
        const agePastExpiry = now() - exp;
        if (agePastExpiry > 0 && agePastExpiry <= swr) {
          if (_asBag(rt).__CACHE_SWR_DISABLED__ === true) {
            try { incCounter(rt, "cache.refresh_aside.count", 1, { action: "disabled" }); } catch {}
          } else {
            try { incCounter(rt, "cache.refresh_aside.count", 1, { action: "serve_stale" }); } catch {}
            try { lruTouch(rt, key); } catch {}

            const inflight = getInflight(rt);
            if (!inflight.has(key)) {
              try {
                const meta = getRefreshAsideMeta(rt);
                meta.set(key, now());
                setTimeout(() => { try { meta.delete(key); } catch {} }, Math.min(swr, __CACHE_REFRESH_ASIDE_META_TTL_MS));
              } catch {}
              __mInc(rt, "cache.refresh.triggered", 1, { reason: "refresh_aside" });
              const __tR = __nowMs();

              const pp = (async () => {
                try {
                  const __v = await computeAndSet(rt, key, compute, opts);
                  __mInc(rt, "cache.refresh.success", 1, { reason: "refresh_aside" });
                  return __v;
                } catch (e) {
                  __mInc(rt, "cache.refresh.fail", 1, { reason: "refresh_aside" });
                  throw e;
                } finally {
                  try { __deferMicrotask(() => { try { inflight.delete(key); } catch {} }); } catch {}
                  __mHist(rt, "cache.refresh.latency_ms", __nowMs() - __tR, { reason: "refresh_aside" });
                }
              })();

              inflight.set(key, pp);
            } else {
              __mInc(rt, "cache.refresh.dedup", 1, { reason: "refresh_aside" });
              try { incCounter(rt, "cache.compute.dedup.count", 1, { reason: "refresh_aside" }); } catch {}
            }

            return entry.value;
          }
        }
      }
    }
  }

  const existing = await cacheGet(rt, key);
  if (existing !== null && existing !== undefined) {
    lruTouch(rt, key);
    return existing;
  }

  const inflight = getInflight(rt);
  if (inflight.has(key)) {
    __mInc(rt, "cache.refresh.dedup", 1, { reason: "singleflight" });
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
