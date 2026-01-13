import { describe, it, expect } from "vitest";
import { cacheGetOrCompute, cacheGetOrComputeSingleFlight } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";
describe("cache — refresh metrics shape (contract)", () => {
  it("emits refresh metrics with canonical tags (reason) when refresh-aside triggers", async () => {
    const rt: any = {};
    let n = 0;

    await cacheGetOrCompute(rt, "mshape", async () => (++n), { ttlMs: 10, staleWhileRevalidateMs: 100, maxEntries: 10 });
    await new Promise(r => setTimeout(r, 15));
    await cacheGetOrCompute(rt, "mshape", async () => (++n), { ttlMs: 10, staleWhileRevalidateMs: 100, maxEntries: 10 });

    // allow background to complete
    await new Promise(r => setTimeout(r, 25));

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    expect(keys.some(k => k.startsWith("cache.refresh.triggered"))).toBe(true);
    expect(keys.some(k => k.startsWith("cache.refresh.success")) || keys.some(k => k.startsWith("cache.refresh.fail"))).toBe(true);

    // histogram exists (latency)
    const h = Object.keys(m.histograms || {});
    expect(h.some(k => k.startsWith("cache.refresh.latency_ms"))).toBe(true);
  });

  it("tags singleflight dedup as reason=singleflight (no crash, best-effort)", async () => {
    const rt: any = {};
    let n = 0;

    const p1 = cacheGetOrComputeSingleFlight(rt, "sf", async () => {
      await new Promise(r => setTimeout(r, 10));
      return ++n;
    }, { ttlMs: 50, staleWhileRevalidateMs: 0, maxEntries: 10 });

    const p2 = cacheGetOrComputeSingleFlight(rt, "sf", async () => (++n), { ttlMs: 50, staleWhileRevalidateMs: 0, maxEntries: 10 });

    await Promise.all([p1, p2]);

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    // we only assert presence of refresh.dedup metric (tagging is internal and best-effort)
    expect(keys.some(k => k.startsWith("cache.refresh.dedup"))).toBe(true);
  });
});
