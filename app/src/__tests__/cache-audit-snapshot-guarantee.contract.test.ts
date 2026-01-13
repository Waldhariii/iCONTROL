import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";

describe("cache audit snapshot (guarantee)", () => {
  it("ensures audit surface exposes snapshot() always after first cache touch", async () => {
    const rt: any = { __now: () => Date.now() };
    const v = await cacheGetOrCompute(rt, "k:audit:guarantee", async () => 1, { ttlMs: 50 });
    expect(v).toBe(1);

    const audit = (rt as any).__cacheAudit;
    expect(audit).toBeTruthy();
    expect(typeof audit.snapshot).toBe("function");

    const snap = audit.snapshot();
    expect(snap).toBeTruthy();
    expect(typeof snap.ts).toBe("number");
    expect(typeof snap.schemaVersion).toBe("number");
    expect(typeof snap.swrDisabled).toBe("boolean");
    expect(typeof snap.metricsDisabled).toBe("boolean");
  });
});
