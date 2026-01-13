import { describe, it, expect } from "vitest";
import { evaluateFeatureFlags, decideFlag } from "../policies/feature_flags.enforce";

describe("feature flags enforce (contract)", () => {
  it("FORCE_OFF dominates", () => {
    const d = decideFlag("a", { state: "FORCE_OFF" }, { tenant: "t1" });
    expect(d.kind).toBe("FORCED_OFF");
  });

  it("ON/OFF map to enabled/disabled", () => {
    expect(decideFlag("a", { state: "ON" }, { tenant: "t1" }).kind).toBe("ENABLED");
    expect(decideFlag("a", { state: "OFF" }, { tenant: "t1" }).kind).toBe("DISABLED");
  });

  it("ROLLOUT is deterministic per tenant/key/seed", () => {
    const a1 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t1", seed: "s" });
    const a2 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t1", seed: "s" });
    expect(a1.kind).toBe(a2.kind);
    expect(a1.bucket).toBe(a2.bucket);
  });

  it("different tenant yields potentially different bucket", () => {
    const a1 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t1", seed: "s" });
    const a2 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t2", seed: "s" });
    expect(a1.bucket).not.toBeUndefined();
    expect(a2.bucket).not.toBeUndefined();
    // not strictly guaranteed different, but extremely likely; assert only that bucket exists
  });

  it("evaluateFeatureFlags returns sorted stable output", () => {
    const res = evaluateFeatureFlags(
      { flags: { b: { state: "ON" }, a: { state: "OFF" } } },
      { tenant: "t1" }
    );
    expect(res.map((x) => x.key)).toEqual(["a", "b"]);
  });
});
