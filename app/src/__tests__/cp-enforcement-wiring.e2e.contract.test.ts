import { describe, it, expect } from "vitest";
import {
  registerCpEnforcementDeps,
  bindActivationRegistry,
  bindPolicyEngine,
  __resetForTests,
} from "../core/ports/cpEnforcement.wiring";

describe("CP enforcement wiring (e2e contract)", () => {
  it("binds via DI without cross-boundary imports", () => {
    __resetForTests();

    registerCpEnforcementDeps({
      activationRegistry: {
        async isEnabled() { return { enabled: true, reason: "test" }; },
        async setEnabled() { /* no-op */ },
        async listEnabled() { return ["m1"]; },
      },
      policyEngine: {
        evaluate() { return { allow: true, reasons: ["test"] }; },
      },
    });

    const act = bindActivationRegistry();
    const pol = bindPolicyEngine();

    expect(typeof act.isEnabled).toBe("function");
    expect(typeof act.setEnabled).toBe("function");
    expect(typeof act.listEnabled).toBe("function");
    expect(typeof pol.evaluate).toBe("function");
  });

  it("throws if deps are not registered", () => {
    __resetForTests();
    expect(() => bindActivationRegistry()).toThrow(/ERR_CP_ENFORCEMENT_DEPS_NOT_REGISTERED/);
  });
});
