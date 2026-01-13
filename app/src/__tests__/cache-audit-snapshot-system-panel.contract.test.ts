import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";

describe("cache audit snapshot (system ui contract)", () => {
  it("exposes JSON-safe snapshot with required fields after first cache touch", async () => {
    const rt: any = { __now: () => Date.now() };
    const v = await cacheGetOrCompute(rt, "k:audit:system:panel", async () => 1, { ttlMs: 50 });
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

    for (const k of Object.keys(snap)) {
      expect(typeof (snap as any)[k]).not.toBe("function");
    }

    const json = JSON.stringify(snap);
    expect(typeof json).toBe("string");
    expect(json.length).toBeGreaterThan(2);
  });
});
