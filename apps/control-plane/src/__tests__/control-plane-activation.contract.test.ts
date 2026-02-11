import { describe, it, expect } from "vitest";
import { ACTIVATION_REGISTRY, getDefaultActivationMap } from "../platform/controlPlane/activationRegistry";

describe("Control Plane activation registry (contract)", () => {
  it("has unique keys and explicit defaults", () => {
    const keys = ACTIVATION_REGISTRY.map(e => e.key);
    const set = new Set(keys);
    expect(set.size).toBe(keys.length);

    for (const e of ACTIVATION_REGISTRY) {
      expect(e.defaultState).toMatch(/^(on|off|beta|hidden)$/);
      expect(typeof e.description).toBe("string");
      expect(e.description.length).toBeGreaterThan(3);
    }
  });

  it("default activation map covers registry keys", () => {
    const m = getDefaultActivationMap();
    for (const e of ACTIVATION_REGISTRY) {
      expect(m[e.key]).toBeDefined();
    }
  });
});
