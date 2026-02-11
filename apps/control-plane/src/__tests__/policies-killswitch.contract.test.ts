import { describe, it, expect } from "vitest";
import { cacheGet, cacheSet, cacheGetOrCompute } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("policies — kill-switches (contract)", () => {
  it("metrics kill-switch: rt.__METRICS_DISABLED__ disables counter/histogram emission", async () => {
    const rt: any = { __METRICS_DISABLED__: true };

    await cacheSet(rt, "mks", 1, { ttlMs: 1000, tags: ["m"] });
    await cacheGet(rt, "mks");
    await cacheGet(rt, "missing");

    const m = snapshotMetrics(rt);
    expect(Object.keys(m.counters || {}).length).toBe(0);
    expect(Object.keys(m.histograms || {}).length).toBe(0);
  });

  it("LRU kill-switch: rt.__CACHE_LRU_DISABLED__ prevents eviction even when maxEntries is exceeded", async () => {
    const rt: any = { __CACHE_LRU_DISABLED__: true };

    // maxEntries=1 would normally evict "a" when inserting "b" if LRU is enabled
    await cacheGetOrCompute(rt, "a", async () => 1, { ttlMs: 1000, staleWhileRevalidateMs: 0, maxEntries: 1 });
    await cacheGetOrCompute(rt, "b", async () => 2, { ttlMs: 1000, staleWhileRevalidateMs: 0, maxEntries: 1 });

    expect(await cacheGet(rt, "a")).toBe(1);
    expect(await cacheGet(rt, "b")).toBe(2);
  });

  it("SWR kill-switch: rt.__CACHE_SWR_DISABLED__ recomputes instead of serving stale", async () => {
    const rt: any = { __CACHE_SWR_DISABLED__: true };
    let n = 0;

    const v1 = await cacheGetOrCompute(rt, "swr", async () => (++n), { ttlMs: 20, staleWhileRevalidateMs: 200, maxEntries: 10 });
    expect(v1).toBe(1);

    await new Promise(r => setTimeout(r, 30)); // expire TTL

    const v2 = await cacheGetOrCompute(rt, "swr", async () => (++n), { ttlMs: 20, staleWhileRevalidateMs: 200, maxEntries: 10 });
    expect(v2).toBe(2);
  });
});
