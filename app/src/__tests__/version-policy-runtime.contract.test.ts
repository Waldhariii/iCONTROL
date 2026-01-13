import { describe, it, expect } from "vitest";
import { applyVersionPolicyBootGuards } from "../policies/version_policy.runtime";

describe("version-policy runtime adapter (contract)", () => {
  it("publishes __versionPolicy and returns outcome", () => {
    const rt: any = {};
    const out = applyVersionPolicyBootGuards(rt);
    expect(out).toBeTruthy();
    expect(rt.__versionPolicy).toBeTruthy();
    expect(rt.__versionPolicy.policy).toBeTruthy();
  });

  it("publishes __bootBanner on SOFT_BLOCK override", () => {
    const rt: any = {};
    applyVersionPolicyBootGuards(rt, {
      status: "SOFT_BLOCK",
      min_version: "1.0.0",
      latest_version: "2.0.0",
      message: "Update soon",
      safe_mode: false,
      capabilities: [],
    });
    expect(rt.__bootBanner?.kind).toBe("SOFT_BLOCK");
  });

  it("publishes __bootBlock on HARD_BLOCK override", () => {
    const rt: any = {};
    applyVersionPolicyBootGuards(rt, {
      status: "HARD_BLOCK",
      min_version: "9.9.9",
      latest_version: "9.9.9",
      message: "Blocked",
      safe_mode: false,
      capabilities: [],
    });
    expect(rt.__bootBlock?.kind).toBe("HARD_BLOCK");
  });
});
