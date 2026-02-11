import { describe, it, expect } from "vitest";
import { makeDefaultEntitlementsFacade } from "../core/ports/defaultEntitlements.facade";

describe("default entitlements baseline", () => {
  it("returns deterministic sorted baseline", async () => {
    const p = makeDefaultEntitlementsFacade();
    const snap = await p.getDefaultEntitlements("acme");
    expect(snap.tenantKey).toBe("acme");
    expect(snap.source).toBe("default-baseline");
    const sorted = [...snap.granted].sort((a,b)=>a.localeCompare(b));
    expect(snap.granted).toEqual(sorted);
    expect(new Set(snap.granted).size).toBe(snap.granted.length);
    expect(snap.granted.length).toBeGreaterThan(0);
  });
});
