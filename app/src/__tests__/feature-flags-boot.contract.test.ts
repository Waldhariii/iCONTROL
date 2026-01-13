import { describe, it, expect } from "vitest";
import { buildFeatureFlagsBootOutcome } from "../policies/feature_flags.boot";

describe("feature flags boot outcome (contract)", () => {
  it("produces outcome with decisions and audit array", () => {
    const out = buildFeatureFlagsBootOutcome(undefined, { tenant: "t1" });
    expect(out).toBeTruthy();
    expect(out.flags).toBeTruthy();
    expect(Array.isArray(out.decisions)).toBe(true);
    expect(Array.isArray(out.audit)).toBe(true);
  });

  it("propagates override decisions", () => {
    const out = buildFeatureFlagsBootOutcome({ flags: { "x.demo": { state: "ON" } } }, { tenant: "t1" });
    expect(out.decisions.some((d) => d.key === "x.demo")).toBe(true);
  });
});
