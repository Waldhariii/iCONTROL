import { describe, it, expect } from "vitest";
import { cacheGetOrCompute, cacheGetOrComputeSingleFlight } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("cache — refresh metrics no-throw (contract)", () => {
  it("does not throw when refresh-aside triggers without runtime hooks", async () => {
    const rt: any = {}; // no rt.metrics hooks, minimal runtime
    let n = 0;

    // prime with small TTL so it expires quickly
    await cacheGetOrCompute(rt, "k", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });

    // wait past TTL so it becomes expired but within SWR
    await new Promise(r => setTimeout(r, 10));

    // should serve stale and trigger background refresh-aside (best-effort)
    const v = await cacheGetOrCompute(rt, "k", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });
    expect(v).toBe(1);

    // allow refresh microtask to complete
    await new Promise(r => setTimeout(r, 15));

    // metrics snapshot must not throw
    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    const h = Object.keys(m.histograms || {});

    // Minimal assertions: if metrics are wired, they should exist; do not overspec exact counts.
    // We assert at least "triggered" OR a result OR dedup (depending on timing).
    const hasTriggered = keys.some(k => k.startsWith("cache.refresh.triggered"));
    const hasResult = keys.some(k => k.startsWith("cache.refresh.success")) || keys.some(k => k.startsWith("cache.refresh.fail"));
    const hasDedup = keys.some(k => k.startsWith("cache.refresh.dedup"));
    const hasLatency = h.some(k => k.startsWith("cache.refresh.latency_ms"));

    expect(hasTriggered || hasResult || hasDedup).toBe(true);
    expect(hasLatency || hasResult || hasDedup).toBe(true);
  });

  it("does not throw on singleflight dedup path and emits refresh.dedup best-effort", async () => {
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
    expect(keys.some(k => k.startsWith("cache.refresh.dedup"))).toBe(true);
  });

  it("respects __METRICS_DISABLED__ (no refresh metrics emitted)", async () => {
    const rt: any = { __METRICS_DISABLED__: true };
    let n = 0;

    await cacheGetOrCompute(rt, "off", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });
    await new Promise(r => setTimeout(r, 10));
    await cacheGetOrCompute(rt, "off", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    expect(keys.filter(k => k.startsWith("cache.refresh.")).length).toBe(0);
  });
});
