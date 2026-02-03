import { describe, it, expect } from "vitest";
import { getCpNavCatalogDriven } from "../core/nav/cpNav.catalog";
import { getCpSurfaceRegistryCatalogDriven } from "../core/ports/cpSurfaceRegistry.catalog";

describe("CP nav is catalog-driven (contract)", () => {
  it("returns non-empty nav items and matches registry-derived routes", async () => {
    const nav = await getCpNavCatalogDriven();
    expect(Array.isArray(nav)).toBe(true);
    expect(nav.length).toBeGreaterThan(0);

    const reg = await getCpSurfaceRegistryCatalogDriven();
    const entries = Array.isArray((reg as any)?.entries) ? (reg as any).entries : [];
    expect(entries.length).toBeGreaterThan(0);

    const regIds = new Set(entries.map((e: any) => e.surfaceId));
    for (const item of nav) {
      expect(regIds.has(item.id)).toBe(true);
      expect(item.route.startsWith("/cp/#/")).toBe(true);
      expect(item.id.startsWith("cp.")).toBe(true);
    }
  });
});
