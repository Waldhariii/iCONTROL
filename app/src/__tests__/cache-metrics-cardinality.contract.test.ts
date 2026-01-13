import { describe, it, expect } from "vitest";
import { cacheGetOrCompute, cacheGetOrComputeSingleFlight } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("cache — metrics cardinality guardrails (contract)", () => {
  it("does not create unbounded metric keys for refresh.dedup reason tagging", async () => {
    const rt: any = {};
    // Force multiple keys but reasons should remain bounded (singleflight | refresh_aside)
    const N = 80;

    // 1) Singleflight dedup: same key, concurrent calls
    for (let i = 0; i < 10; i++) {
      await Promise.all([
        cacheGetOrComputeSingleFlight(rt, "sf-card", async () => 1, { ttlMs: 50, staleWhileRevalidateMs: 0, maxEntries: 200 }),
        cacheGetOrComputeSingleFlight(rt, "sf-card", async () => 1, { ttlMs: 50, staleWhileRevalidateMs: 0, maxEntries: 200 }),
      ]);
    }

    // 2) Refresh-aside path: many keys to create markers, but reason label set must stay bounded
    for (let i = 0; i < N; i++) {
      const k = "ra-card-" + i;
      await cacheGetOrCompute(rt, k, async () => 1, { ttlMs: 1, staleWhileRevalidateMs: 40, maxEntries: 500 });
      await new Promise(r => setTimeout(r, 3));
      await cacheGetOrCompute(rt, k, async () => 1, { ttlMs: 1, staleWhileRevalidateMs: 40, maxEntries: 500 });
      // small pause to reduce flakiness around background refresh
      await new Promise(r => setTimeout(r, 1));
      await cacheGetOrCompute(rt, k, async () => 1, { ttlMs: 50, staleWhileRevalidateMs: 40, maxEntries: 500 });
    }

    const m = snapshotMetrics(rt);
    const keys = Object.keys(m.counters || {});
    const dedupKeys = keys.filter(k => k.startsWith("cache.refresh.dedup"));

    // Guardrail: we expect only a small number of distinct keys for dedup metric.
    // If label explosion occurs, this grows with N and becomes noisy/expensive.
    expect(dedupKeys.length).toBeGreaterThan(0);
    expect(dedupKeys.length).toBeLessThan(12);

    // Stronger: reasons should be bounded to known set (best-effort; tolerate missing tags but reject unknown proliferation)
    const reasons = new Set<string>();
    for (const k of dedupKeys) {
      const mReason = k.match(/reason=([^|]+)/);
      if (mReason?.[1]) reasons.add(mReason[1]);
    }
    for (const r of Array.from(reasons)) {
      expect(["singleflight", "refresh_aside"].includes(r)).toBe(true);
    }
  });
});
