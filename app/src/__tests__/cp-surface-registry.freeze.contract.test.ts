import { describe, it, expect } from "vitest";
import { CP_SURFACE_KEYS, CP_SURFACE_REGISTRY } from "../core/runtime/cpSurfaceRegistry";

describe("Move15: CP surface registry (freeze contract)", () => {
  it("exports stable keys list", () => {
    expect(Array.isArray(CP_SURFACE_KEYS)).toBe(true);
    expect(CP_SURFACE_KEYS.length).toBeGreaterThan(0);
    expect(CP_SURFACE_KEYS).toContain("cp.users");
    expect(CP_SURFACE_KEYS).toContain("cp.settings");
    expect(CP_SURFACE_KEYS).toContain("cp.entitlements");
    expect([...CP_SURFACE_KEYS]).toEqual([...CP_SURFACE_KEYS].slice().sort());
    expect(new Set(CP_SURFACE_KEYS).size).toBe(CP_SURFACE_KEYS.length);
  });

  it("registry contains all keys", () => {
    for (const k of CP_SURFACE_KEYS) {
      expect(CP_SURFACE_REGISTRY[k]).toBeTruthy();
      expect(CP_SURFACE_REGISTRY[k].key).toBe(k);
    }
  });

  it("entitlements requires capability", () => {
    expect(CP_SURFACE_REGISTRY["cp.entitlements"].requiredCapability).toBe("canAdminEntitlements");
  });
});
