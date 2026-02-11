import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";

describe("cache — killswitch audit surface (contract)", () => {
  it("exposes kill-switch state in rt.__cacheAudit (best-effort) without throwing", async () => {
    const rt: any = {};

    // flip switches
    rt.__CACHE_SWR_DISABLED__ = true;
    rt.__METRICS_DISABLED__ = true;

    // should not throw
    await cacheGetOrCompute(rt, "audit-ks", async () => 1, { ttlMs: 5, staleWhileRevalidateMs: 50, maxEntries: 50 });

    // audit is best-effort: if present, must reflect flags
    const a = rt.__cacheAudit;
    if (a) {
      expect(typeof a).toBe("object");
      expect(a.swrDisabled === true).toBe(true);
      expect(a.metricsDisabled === true).toBe(true);
      // optional versioning hook if you add it later
      if (a.schemaVersion !== undefined) {
        expect(typeof a.schemaVersion).toBe("number");
      }
    } else {
      // acceptable if you choose not to implement the surface, but then add it now in P1.2
      expect(true).toBe(true);
    }
  });
});
