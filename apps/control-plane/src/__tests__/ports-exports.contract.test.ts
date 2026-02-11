import { describe, it, expect } from "vitest";

// This is the ONLY allowed entrypoint for port consumption.
import * as Ports from "../core/ports";

describe("SSOT ports exports (contract)", () => {
  it("exports required factory symbols (activation registry + policy engine)", () => {
    // Activation registry
    expect(typeof (Ports as any).createActivationRegistryFacade).toBe("function");
    // Policy engine
    expect(typeof (Ports as any).createPolicyEngineFacade).toBe("function");
  });

  it("exports CP enforcement bootstrap symbols", () => {
    // Bootstrap should be present and callable or at least exported (depending on implementation)
    expect((Ports as any).cpEnforcementBootstrap || (Ports as any).bootstrapCpEnforcement).toBeTruthy();
  });
});
