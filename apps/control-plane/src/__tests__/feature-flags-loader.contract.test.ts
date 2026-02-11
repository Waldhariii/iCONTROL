import { describe, it, expect } from "vitest";
import { loadFeatureFlags } from "../policies/feature_flags.loader";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("feature flags loader (contract)", () => {
  it("loads default when no override provided", () => {
    const out = loadFeatureFlags();
    expect(out.source).toBe("default");
    expect(out.flags).toBeTruthy();
    expect(Array.isArray(out.audit)).toBe(true);
  });

  it("accepts valid override", () => {
    const out = loadFeatureFlags({ flags: { "x.demo": { state: "ON" } } });
    expect(out.source).toBe("override");
    expect(out.flags.flags["x.demo"].state).toBe("ON");
    expect(out.audit.length).toBe(0);
  });

  it("rejects invalid override and records WARN_FLAG_INVALID", () => {
    const out = loadFeatureFlags({ bad: true });
    expect(out.source).toBe("default");
    expect(out.audit.some((e) => e.code === (ERROR_CODES.WARN_FLAG_INVALID ?? "WARN_FLAG_INVALID"))).toBe(true);
  });
});
