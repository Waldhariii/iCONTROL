import { describe, it, expect } from "vitest";
import type { PolicyDecision } from "../contracts/policyEngine.contract";

describe("Contract-First: PolicyEnginePort (core-kernel contract)", () => {
  it("PolicyDecision is a discriminated union (allow/deny)", () => {
    const allow: PolicyDecision = { allow: true, reasons: ["OK"] };
    const deny: PolicyDecision = { allow: false, reasons: ["NO"], code: "ERR_DENY" };
    expect(allow.allow).toBe(true);
    expect(deny.allow).toBe(false);
  });
});
