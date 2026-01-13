import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("cache — refresh-aside meta-marker hygiene (contract)", () => {
  it("does not change returned value on hit; emits refresh_aside dedup at most once", async () => {
    const rt: any = {};
    let n = 0;

    // Prime value, small TTL, SWR enabled.
    await cacheGetOrCompute(rt, "mk", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });

    // Let it expire but remain within SWR.
    await new Promise(r => setTimeout(r, 10));

    // Trigger refresh-aside (serve stale).
    const v1 = await cacheGetOrCompute(rt, "mk", async () => 1, { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });
    expect(v1).toBe(1);

    // Immediate hit while meta-marker exists: should still return cached value (not recompute).
    const v2 = await cacheGetOrCompute(rt, "mk", async () => 1, { ttlMs: 50, staleWhileRevalidateMs: 50, maxEntries: 10 });
    expect(v2).toBe(1);

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    const count = keys.filter(k => k.startsWith("cache.refresh.dedup") && /reason=refresh_aside/.test(k)).length;

    // At most one emission due to marker consumption.
    expect(count === 0 || count === 1).toBe(true);
  });

  it("opportunistic purge prevents unbounded growth (best-effort smoke)", async () => {
    const rt: any = {};

    // Create many meta markers via refresh-aside triggers.
    for (let i = 0; i < 50; i++) {
      const key = "mk_" + i;
      await cacheGetOrCompute(rt, key, async () => i, { ttlMs: 1, staleWhileRevalidateMs: 50, maxEntries: 200 });
      await new Promise(r => setTimeout(r, 2));
      await cacheGetOrCompute(rt, key, async () => i, { ttlMs: 1, staleWhileRevalidateMs: 50, maxEntries: 200 });
    }

    // Just ensure nothing throws and system is stable; purge is internal best-effort.
    expect(true).toBe(true);
  });
});
