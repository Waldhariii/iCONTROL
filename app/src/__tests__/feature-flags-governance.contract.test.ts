import { describe, it, expect } from "vitest";
import { auditGovernedFeatureFlags } from "../core/governance/featureFlagsGov";

describe("feature flags governance (contract)", () => {
  it("returns WARN_FF_EMPTY when input is not an object", () => {
    const out = auditGovernedFeatureFlags(null);
    expect(out.some((f) => f.code === "WARN_FF_EMPTY")).toBe(true);
  });

  it("flags missing metadata", () => {
    const out = auditGovernedFeatureFlags({ flags: { "x.y": { enabled: true } } });
    expect(out.some((f) => f.code === "WARN_FF_MISSING_META" && f.flag === "x.y")).toBe(true);
  });

  it("flags expired entries", () => {
    const out = auditGovernedFeatureFlags(
      {
        flags: {
          "a.b": {
            enabled: true,
            owner: "governance",
            justification: "testing expiry path",
            expires_on: "2020-01-01",
            risk: "LOW",
          },
        },
      },
      new Date("2026-01-01T00:00:00Z"),
    );
    expect(out.some((f) => f.code === "WARN_FF_EXPIRED" && f.flag === "a.b")).toBe(true);
  });
});
