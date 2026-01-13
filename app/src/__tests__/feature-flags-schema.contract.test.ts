import { describe, it, expect } from "vitest";
import { isFeatureFlag, isFeatureFlagSet } from "../policies/feature_flags.schema";

describe("feature flags schema (contract)", () => {
  it("accepts empty set", () => {
    expect(isFeatureFlagSet({ flags: {} })).toBe(true);
  });

  it("accepts ON/OFF/FORCE_OFF flags", () => {
    expect(isFeatureFlag({ state: "ON" })).toBe(true);
    expect(isFeatureFlag({ state: "OFF" })).toBe(true);
    expect(isFeatureFlag({ state: "FORCE_OFF" })).toBe(true);
  });

  it("accepts ROLLOUT with 0..100", () => {
    expect(isFeatureFlag({ state: "ROLLOUT", rollout: 0 })).toBe(true);
    expect(isFeatureFlag({ state: "ROLLOUT", rollout: 50 })).toBe(true);
    expect(isFeatureFlag({ state: "ROLLOUT", rollout: 100 })).toBe(true);
  });

  it("rejects invalid state or rollout shape", () => {
    expect(isFeatureFlag({ state: "MAYBE" } as any)).toBe(false);
    expect(isFeatureFlag({ state: "ROLLOUT", rollout: -1 } as any)).toBe(false);
    expect(isFeatureFlag({ state: "ROLLOUT", rollout: 101 } as any)).toBe(false);
    expect(isFeatureFlag({ state: "ON", rollout: 10 } as any)).toBe(false);
  });

  it("rejects invalid set entries", () => {
    expect(isFeatureFlagSet({ flags: { "": { state: "ON" } } } as any)).toBe(false);
    expect(isFeatureFlagSet({ flags: { a: { state: "ON", rollout: 10 } } } as any)).toBe(false);
  });
});
