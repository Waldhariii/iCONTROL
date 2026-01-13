import { describe, it, expect } from "vitest";
import { cacheGet, cacheSet, cacheInvalidateTag } from "../policies/cache.registry";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("cache — registry (contract)", () => {
  it("stores and returns values, then expires by TTL", async () => {
    const rt: any = {};
    await cacheSet(rt, "k1", { a: 1 }, { ttlMs: 30, tags: ["t1"] });

    const v1 = await cacheGet<any>(rt, "k1");
    expect(v1).toBeTruthy();
    expect(v1.a).toBe(1);

    await new Promise(r => setTimeout(r, 40));
    const v2 = await cacheGet<any>(rt, "k1");
    expect(v2).toBe(null);
  });

  it("invalidates by tag and returns number of deleted keys", async () => {
    const rt: any = {};
    await cacheSet(rt, "a", 1, { ttlMs: 1000, tags: ["tagX"] });
    await cacheSet(rt, "b", 2, { ttlMs: 1000, tags: ["tagX"] });
    await cacheSet(rt, "c", 3, { ttlMs: 1000, tags: ["tagY"] });

    const n = await cacheInvalidateTag(rt, "tagX");
    expect(n).toBe(2);

    expect(await cacheGet(rt, "a")).toBe(null);
    expect(await cacheGet(rt, "b")).toBe(null);
    expect(await cacheGet(rt, "c")).toBe(3);
  });

  it("emits cache metrics (get/set) best-effort", async () => {
    const rt: any = {};
    await cacheSet(rt, "m1", 1, { ttlMs: 1000, tags: ["m"] });
    await cacheGet(rt, "m1");
    await cacheGet(rt, "missing");

    const m = snapshotMetrics(rt);
    const hasGet = Object.keys(m.counters).some(k => k.startsWith("cache.get.count"));
    const hasSet = Object.keys(m.counters).some(k => k.startsWith("cache.set.count"));
    expect(hasGet).toBe(true);
    expect(hasSet).toBe(true);
  });

  it("does not throw on nullish runtime", async () => {
    await cacheSet(null as any, "x", 1, { ttlMs: 1, tags: ["t"] });
    const v = await cacheGet(null as any, "x");
    expect(v === null || v === 1).toBe(true);
  });
});
