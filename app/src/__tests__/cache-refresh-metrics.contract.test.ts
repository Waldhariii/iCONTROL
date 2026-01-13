import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("cache — refresh-aside metrics (contract)", () => {
  it("emits refresh.* counters best-effort when serving stale and triggering background refresh", async () => {
    const rt: any = {};

    let n = 0;

    // 1) Prime
    const v1 = await cacheGetOrCompute(
      rt,
      "rm",
      async () => (++n),
      { ttlMs: 20, staleWhileRevalidateMs: 200, maxEntries: 10 }
    );
    expect(v1).toBe(1);

    // 2) Expire TTL but stay within SWR window
    await new Promise(r => setTimeout(r, 30));

    // 3) This call should serve stale and trigger refresh-aside best-effort
    const v2 = await cacheGetOrCompute(
      rt,
      "rm",
      async () => (++n),
      { ttlMs: 20, staleWhileRevalidateMs: 200, maxEntries: 10 }
    );

    // Depending on timing, stale can be served (1) or recompute (2), but must never crash
    expect([1, 2]).toContain(v2);

    // Give background refresh a moment to complete (best-effort)
    await new Promise(r => setTimeout(r, 20));

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    const hasTriggered = keys.some(k => k.startsWith("cache.refresh.triggered"));
    const hasDedupOrResult =
      keys.some(k => k.startsWith("cache.refresh.dedup")) ||
      keys.some(k => k.startsWith("cache.refresh.success")) ||
      keys.some(k => k.startsWith("cache.refresh.fail"));

    expect(hasTriggered).toBe(true);
    expect(hasDedupOrResult).toBe(true);
  });

  it("respects __METRICS_DISABLED__ (no refresh metrics emitted)", async () => {
    const rt: any = { __METRICS_DISABLED__: true };
    let n = 0;

    await cacheGetOrCompute(
      rt,
      "rm_off",
      async () => (++n),
      { ttlMs: 10, staleWhileRevalidateMs: 100, maxEntries: 10 }
    );

    await new Promise(r => setTimeout(r, 15));

    await cacheGetOrCompute(
      rt,
      "rm_off",
      async () => (++n),
      { ttlMs: 10, staleWhileRevalidateMs: 100, maxEntries: 10 }
    );

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    expect(keys.filter(k => k.startsWith("cache.refresh.")).length).toBe(0);
  });
});
