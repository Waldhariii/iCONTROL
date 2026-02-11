import { describe, it, expect } from "vitest";
import {
  registerCpEnforcementDeps,
  bindActivationRegistry,
  bindPolicyEngine,
  __resetForTests,
} from "../core/ports/cpEnforcement.wiring";

describe("CP enforcement enable/deny (e2e contract)", () => {
  it("denies when activation is disabled; allows when enabled (policy uses activation)", async () => {
    __resetForTests();

    let enabled = false;

    registerCpEnforcementDeps({
      activationRegistry: {
        async isEnabled() {
          return { enabled, reason: enabled ? "OK_ENABLED" : "ERR_DISABLED" };
        },
        async setEnabled(cmd) {
          enabled = !!cmd.enabled;
        },
        async listEnabled() {
          return enabled ? ["mod.test"] : [];
        },
      },
      policyEngine: {
        evaluate(input) {
          // minimal rule: if module disabled -> deny
          const isMod = input?.resource?.moduleId === "mod.test";
          if (isMod && !enabled) return { allow: false, reasons: ["ERR_POLICY_DENY_DISABLED"] };
          return { allow: true, reasons: ["OK_POLICY_ALLOW"] };
        },
      },
    });

    const act = bindActivationRegistry();
    const pol = bindPolicyEngine();

    // Initially disabled
    const d0 = pol.evaluate({ resource: { moduleId: "mod.test" } });
    expect(d0.allow).toBe(false);

    // Enable
    await act.setEnabled({ tenantId: "t1", moduleId: "mod.test", enabled: true, actorId: "admin", correlationId: "corr1" });
    const d1 = pol.evaluate({ resource: { moduleId: "mod.test" } });
    expect(d1.allow).toBe(true);

    // Disable again
    await act.setEnabled({ tenantId: "t1", moduleId: "mod.test", enabled: false, actorId: "admin", correlationId: "corr2" });
    const d2 = pol.evaluate({ resource: { moduleId: "mod.test" } });
    expect(d2.allow).toBe(false);
  });
});
