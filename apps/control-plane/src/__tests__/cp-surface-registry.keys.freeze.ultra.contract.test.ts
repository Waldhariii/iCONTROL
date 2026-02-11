import { describe, it, expect } from "vitest";
import { CP_SURFACE_KEYS, CP_SURFACE_REGISTRY } from "../core/runtime/cpSurfaceRegistry";

describe("ULTRA: CP surface registry keys are frozen (contract)", () => {
  it("keys are stable, non-empty, and match registry", () => {
    expect(Array.isArray(CP_SURFACE_KEYS)).toBe(true);
    expect(CP_SURFACE_KEYS.length).toBeGreaterThan(0);

    for (const k of CP_SURFACE_KEYS) {
      expect(CP_SURFACE_REGISTRY[k]).toBeTruthy();
      expect(CP_SURFACE_REGISTRY[k].key).toBe(k);
    }

    // no duplicates
    expect(new Set(CP_SURFACE_KEYS).size).toBe(CP_SURFACE_KEYS.length);
  });
});
