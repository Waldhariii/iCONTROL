import { describe, it, expect } from "vitest";
import { loadVersionPolicy } from "../policies/version_policy.loader";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("version-policy loader (contract)", () => {
  it("loads default policy when no override provided", () => {
    const res = loadVersionPolicy();
    expect(res.source).toBe("default");
    expect(res.policy).toBeTruthy();
    expect(res.policy.status).toBeTruthy();
    expect(Array.isArray(res.audit)).toBe(true);
  });

  it("accepts a valid override policy", () => {
    const override = {
      status: "SOFT_BLOCK",
      min_version: "1.0.0",
      latest_version: "1.2.3",
      message: "Please update soon.",
      safe_mode: false,
      capabilities: ["cap.a", "cap.b"],
    };

    const res = loadVersionPolicy(override);
    expect(res.source).toBe("override");
    expect(res.policy.status).toBe("SOFT_BLOCK");
    expect(res.audit.some((e) => e.level === "WARN")).toBe(false);
  });

  it("rejects invalid override and records WARN_POLICY_INVALID", () => {
    const res = loadVersionPolicy({ foo: "bar" });
    expect(res.source).toBe("default");
    expect(res.audit.some((e) => e.code === ERROR_CODES.WARN_POLICY_INVALID)).toBe(true);
  });
});
