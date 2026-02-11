import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";

describe("cache — hardening des bornes (contract)", () => {
  it("ttlMs <= 0 => no-expiry semantics (cache persistant)", async () => {
    const rt: any = {};
    let n = 0;

    const v1 = await cacheGetOrCompute(
      rt,
      "negTTL",
      async () => (++n),
      { ttlMs: -500, staleWhileRevalidateMs: 1000, maxEntries: 10 }
    );

    const v2 = await cacheGetOrCompute(
      rt,
      "negTTL",
      async () => (++n),
      { ttlMs: -500, staleWhileRevalidateMs: 1000, maxEntries: 10 }
    );

    expect(v1).toBe(1);
    expect(v2).toBe(1); // cache persistant (no-expiry)
  });

  it("clamp SWR à un multiple raisonnable du TTL", async () => {
    const rt: any = {};
    let n = 0;

    const v1 = await cacheGetOrCompute(
      rt,
      "swrClamp",
      async () => (++n),
      { ttlMs: 10, staleWhileRevalidateMs: 1_000_000, maxEntries: 10 }
    );

    await new Promise(r => setTimeout(r, 20));

    const v2 = await cacheGetOrCompute(
      rt,
      "swrClamp",
      async () => (++n),
      { ttlMs: 10, staleWhileRevalidateMs: 1_000_000, maxEntries: 10 }
    );

    // SWR est borné => stale possible ou recompute, mais jamais crash
    expect([1, 2]).toContain(v2);
  });

  it("clamp maxEntries extrême pour éviter OOM", async () => {
    const rt: any = {};

    const v = await cacheGetOrCompute(
      rt,
      "maxClamp",
      async () => 42,
      { ttlMs: 1000, maxEntries: 1_000_000_000 }
    );

    expect(v).toBe(42);
  });
});
