import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";

describe("cache — SWR kill-switch (contract)", () => {
  it("when __CACHE_SWR_DISABLED__ is true, does NOT serve stale even within SWR window", async () => {
    const rt: any = { __CACHE_SWR_DISABLED__: true };
    let n = 0;

    await cacheGetOrCompute(rt, "ks", async () => (++n), { ttlMs: 10, staleWhileRevalidateMs: 100, maxEntries: 10 });
    await new Promise(r => setTimeout(r, 15));

    // killswitch forces recompute => 2 (not stale 1)
    const v = await cacheGetOrCompute(rt, "ks", async () => (++n), { ttlMs: 10, staleWhileRevalidateMs: 100, maxEntries: 10 });
    expect(v).toBe(2);
  });
});
