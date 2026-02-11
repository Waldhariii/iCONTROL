import { describe, it, expect } from "vitest";
import { buildVersionPolicyBootOutcome } from "../policies/version_policy.boot";

describe("version-policy boot outcome (contract)", () => {
  it("produces an outcome with decisions and audit array", () => {
    const out = buildVersionPolicyBootOutcome();
    expect(out).toBeTruthy();
    expect(out.policy).toBeTruthy();
    expect(Array.isArray(out.decisions)).toBe(true);
    expect(Array.isArray(out.audit)).toBe(true);
  });

  it("propagates override decisions", () => {
    const out = buildVersionPolicyBootOutcome({
      status: "HARD_BLOCK",
      min_version: "9.9.9",
      latest_version: "9.9.9",
      message: "Blocked",
      safe_mode: false,
      capabilities: [],
    });

    expect(out.decisions.some((d) => d.kind === "HARD_BLOCK")).toBe(true);
  });

  it("preserves loader WARN when override invalid", () => {
    const out = buildVersionPolicyBootOutcome({ bad: true });
    expect(out.audit.length).toBeGreaterThanOrEqual(1);
    expect(out.audit.some((e) => e.level === "WARN")).toBe(true);
  });
});
