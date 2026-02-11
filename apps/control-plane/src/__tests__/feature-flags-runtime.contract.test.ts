import { describe, it, expect } from "vitest";
import { applyFeatureFlagsBootGuards } from "../policies/feature_flags.runtime";

describe("feature flags runtime (contract)", () => {
  it("is idempotent and exposes flags/decisions", () => {
    const w: any = {};
    applyFeatureFlagsBootGuards(w, { flags: { "x.demo": { state: "ON" } } });
    expect(w.__FEATURE_FLAGS__).toBeTruthy();
    expect(Array.isArray(w.__FEATURE_DECISIONS__)).toBe(true);

    const before = w.__FEATURE_DECISIONS__;
    applyFeatureFlagsBootGuards(w, { flags: { "x.other": { state: "ON" } } });
    // idempotent: doesn't overwrite on second call
    expect(w.__FEATURE_DECISIONS__).toBe(before);
  });
});
