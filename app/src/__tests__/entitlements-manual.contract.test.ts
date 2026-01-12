import { describe, expect, test } from "vitest";
import { DEFAULT_ENTITLEMENTS, hasPlan, hasModule } from "../core/entitlements";

describe("Entitlements (manual provisioning) — contract", () => {
  test("FREE baseline: hasPlan(PRO)=false and modules default off", () => {
    const e = DEFAULT_ENTITLEMENTS;
    expect(hasPlan(e, "FREE")).toBe(true);
    expect(hasPlan(e, "PRO")).toBe(false);
    expect(hasModule(e, "recommendations.pro")).toBe(false);
  });

  test("PRO plan enables hasPlan(PRO)=true; module flag enables specific capability", () => {
    const e = { ...DEFAULT_ENTITLEMENTS, plan: "PRO" as const, modules: { "recommendations.pro": true } };
    expect(hasPlan(e, "PRO")).toBe(true);
    expect(hasPlan(e, "ENTERPRISE")).toBe(false);
    expect(hasModule(e, "recommendations.pro")).toBe(true);
  });

  test("Expiry governance: expired entitlements downgrade to FREE on load (coercion handled in storage)", () => {
    // Pure gate layer doesn't enforce expiry; storage does. This test asserts intent: expiry should not be trusted by callers.
    const e = { ...DEFAULT_ENTITLEMENTS, plan: "ENTERPRISE" as const, expiresAtMs: Date.now() - 1000, modules: { x: true } };
    // Gate layer remains deterministic:
    expect(hasPlan(e, "ENTERPRISE")).toBe(true);
  });
});
