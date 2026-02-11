import { describe, it, expect } from "vitest";
import { getEntitlementsForTenant } from "../core/subscription/entitlementsApi";

describe("entitlements API contract", () => {
  it("returns enterprise_free by default and has deterministic shape", async () => {
    const out = await getEntitlementsForTenant("t1", "2026-01-11T00:00:00.000Z");
    expect(out.effectivePlanId).toBe("enterprise_free");
    expect(typeof out.reason).toBe("string");
    expect(out.entitlements).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(out.entitlements, "externalSync")).toBe(true);
  });
});
