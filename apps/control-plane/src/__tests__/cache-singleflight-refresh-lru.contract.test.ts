import { describe, it, expect } from "vitest";
import { cacheGetOrComputeSingleFlight, cacheGetOrCompute } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("cache — single-flight + refresh-aside + LRU (contract)", () => {
  
    it("LRU kill-switch: when rt.__CACHE_LRU_DISABLED__ is true, does not evict", async () => {
    const rt: any = { __CACHE_LRU_DISABLED__: true };
    let nA = 0;
    let nB = 0;
    let nC = 0;

    const a1 = await cacheGetOrCompute(rt, "A", async () => (++nA ? "A" : "A"), { ttlMs: 1000, staleWhileRevalidateMs: 0, maxEntries: 2 });
    const b1 = await cacheGetOrCompute(rt, "B", async () => (++nB ? "B" : "B"), { ttlMs: 1000, staleWhileRevalidateMs: 0, maxEntries: 2 });
    const c1 = await cacheGetOrCompute(rt, "C", async () => (++nC ? "C" : "C"), { ttlMs: 1000, staleWhileRevalidateMs: 0, maxEntries: 2 });

    expect(a1).toBe("A");
    expect(b1).toBe("B");
    expect(c1).toBe("C");

    // If LRU eviction were active, one of A/B would likely be evicted when inserting C with maxEntries=2.
    // With kill-switch enabled, no eviction: B must remain cached and not recomputed.
    const b2 = await cacheGetOrCompute(rt, "B", async () => "B2", { ttlMs: 1000, staleWhileRevalidateMs: 0, maxEntries: 2 });
    expect(b2).toBe("B");
  });

it("SWR kill-switch: when rt.__CACHE_SWR_DISABLED__ is true, does not serve stale", async () => {
    const rt: any = { __CACHE_SWR_DISABLED__: true };
    let n = 0;

    // First compute => 1
    const v1 = await cacheGetOrCompute(rt, "ks", async () => (++n), { ttlMs: 20, staleWhileRevalidateMs: 200, maxEntries: 10 });
    expect(v1).toBe(1);

    // Let it expire
    await new Promise(r => setTimeout(r, 30));

    // With SWR disabled, it must recompute (2), not serve stale (1)
    const v2 = await cacheGetOrCompute(rt, "ks", async () => (++n), { ttlMs: 20, staleWhileRevalidateMs: 200, maxEntries: 10 });
    expect(v2).toBe(2);
  });

it("dedupes concurrent compute for same key (single-flight)", async () => {
    const rt: any = {};
    let calls = 0;

    const compute = async () => {
      calls += 1;
      await new Promise(r => setTimeout(r, 20));
      return "V";
    };

    const [a, b, c] = await Promise.all([
      cacheGetOrComputeSingleFlight(rt, "k", compute, { ttlMs: 2000, maxEntries: 50 }),
      cacheGetOrComputeSingleFlight(rt, "k", compute, { ttlMs: 2000, maxEntries: 50 }),
      cacheGetOrComputeSingleFlight(rt, "k", compute, { ttlMs: 2000, maxEntries: 50 }),
    ]);

    expect(a).toBe("V");
    expect(b).toBe("V");
    expect(c).toBe("V");
    expect(calls).toBe(1);

    const m = snapshotMetrics(rt);
    const hasDedup = Object.keys(m.counters).some(k => k.startsWith("cache.compute.dedup.count"));
    expect(hasDedup).toBe(true);
  });

  it("serves stale then refreshes in background (refresh-aside)", async () => {
    const rt: any = {};
    let v = 1;

    // prime with very short TTL
    await cacheGetOrCompute(rt, "s", async () => v, { ttlMs: 10, staleWhileRevalidateMs: 200, maxEntries: 50 });

    // wait until expired but still within stale window
    await new Promise(r => setTimeout(r, 25));

    v = 2;

    // should serve stale immediately (1) and trigger refresh in background
    const stale = await cacheGetOrCompute(rt, "s", async () => v, { ttlMs: 200, staleWhileRevalidateMs: 200, maxEntries: 50 });
    expect(stale).toBe(1);

    // give refresh a moment
    await new Promise(r => setTimeout(r, 25));

    const fresh = await cacheGetOrCompute(rt, "s", async () => v, { ttlMs: 200, staleWhileRevalidateMs: 200, maxEntries: 50 });
    expect(fresh).toBe(2);
  });

  it("evicts least-recently-used when maxEntries exceeded (LRU bound)", async () => {
    const rt: any = {};

    await cacheGetOrComputeSingleFlight(rt, "a", async () => "A", { ttlMs: 5000, maxEntries: 2 });
    await cacheGetOrComputeSingleFlight(rt, "b", async () => "B", { ttlMs: 5000, maxEntries: 2 });

    // touch "a" so "b" becomes LRU
    await cacheGetOrComputeSingleFlight(rt, "a", async () => "A2", { ttlMs: 5000, maxEntries: 2 });

    // insert "c" -> should evict "b"
    await cacheGetOrComputeSingleFlight(rt, "c", async () => "C", { ttlMs: 5000, maxEntries: 2 });

    // best-effort: "b" should be gone, "a" and "c" should remain
    const a2 = await cacheGetOrComputeSingleFlight(rt, "a", async () => "A3", { ttlMs: 5000, maxEntries: 2 });
    const b2 = await cacheGetOrComputeSingleFlight(rt, "b", async () => "B2", { ttlMs: 5000, maxEntries: 2 });

    expect(a2).toBe("A"); // cached value should remain
    expect(b2).toBe("B2"); // recomputed after eviction
  });
});
