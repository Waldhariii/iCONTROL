import { describe, it, expect } from "vitest";
import { getEnabledCapabilitiesForPlan } from "../core/ssot/tenantMatrixLoader";

// Governance: ensures tenant matrix keeps stable shape and returns non-empty defaults.
describe("Governance: tenant matrix invariants (enabled_capabilities)", () => {
  it("FREE plan returns array of capabilities (non-empty, strings)", () => {
    const caps = getEnabledCapabilitiesForPlan("FREE");
    expect(Array.isArray(caps)).toBe(true);
    expect(caps.length).toBeGreaterThan(0);
    for (const c of caps) {
      expect(typeof c).toBe("string");
      expect(c.trim().length).toBeGreaterThan(0);
    }
  });
});
