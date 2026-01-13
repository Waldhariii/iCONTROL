import { describe, it, expect } from "vitest";
import { cacheGetOrComputeSingleFlight, cacheGetOrCompute } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("cache — refresh.dedup reason tagging (contract)", () => {
  it("emits cache.refresh.dedup with a reason tag when singleflight dedups (best-effort)", async () => {
    const rt: any = {};
    let n = 0;

    const p1 = cacheGetOrComputeSingleFlight(
      rt,
      "sf_reason",
      async () => {
        await new Promise(r => setTimeout(r, 10));
        return ++n;
      },
      { ttlMs: 50, staleWhileRevalidateMs: 0, maxEntries: 10 }
    );

    const p2 = cacheGetOrComputeSingleFlight(
      rt,
      "sf_reason",
      async () => (++n),
      { ttlMs: 50, staleWhileRevalidateMs: 0, maxEntries: 10 }
    );

    await Promise.all([p1, p2]);

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});

    // We accept either:
    // - tagged form: "cache.refresh.dedup|reason=singleflight"
    // - or untagged fallback if tagging isn't implemented yet (then this test should fail and we patch)
    const hasTagged = keys.some(k =>
      k.startsWith("cache.refresh.dedup") && /reason=singleflight/.test(k)
    );

    expect(hasTagged).toBe(true);
  });

  it("emits cache.refresh.dedup with reason=refresh_aside when refresh-aside dedups (best-effort)", async () => {
    const rt: any = {};
    let n = 0;

    // Prime cache with short TTL so it expires quickly.
    await cacheGetOrCompute(rt, "ra_reason", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });

    // Let it expire but remain within SWR window.
    await new Promise(r => setTimeout(r, 10));

    // First call serves stale and triggers background refresh.
    await cacheGetOrCompute(rt, "ra_reason", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });

    // Immediate second call while refresh is in-flight should dedup.
    await cacheGetOrCompute(rt, "ra_reason", async () => (++n), { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 10 });

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});

    const hasTagged = keys.some(k =>
      k.startsWith("cache.refresh.dedup") && /reason=refresh_aside/.test(k)
    );

    expect(hasTagged).toBe(true);
  });
});
