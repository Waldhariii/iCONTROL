import { describe, it, expect } from "vitest";
import { bindActivationRegistry, bindPolicyEngine } from "../core/ports/cpEnforcement.wiring";

describe("CP enforcement wiring (e2e contract)", () => {
  it("binds activation registry + policy engine without core-kernel imports", () => {
    const act = bindActivationRegistry();
    const pol = bindPolicyEngine();

    expect(typeof act.isEnabled).toBe("function");
    expect(typeof act.setEnabled).toBe("function");
    expect(typeof act.listEnabled).toBe("function");
    expect(typeof pol.evaluate).toBe("function");
  });
});
