import { describe, it, expect } from "vitest";
import { getCpNavCatalogDriven } from "../core/ports/cpNav.catalog";

describe("CP nav (catalog-driven) — contract", () => {
  it("builds non-empty nav entries (Move3 ensures CP surfaces exist in catalog)", async () => {
    const nav = await getCpNavCatalogDriven();
    expect(Array.isArray(nav)).toBe(true);
    expect(nav.length).toBeGreaterThan(0);
    for (const e of nav) {
      expect(typeof e.id).toBe("string");
      expect(e.id.startsWith("cp.")).toBe(true);
      expect(typeof e.labelKey).toBe("string");
      expect(e.labelKey.startsWith("nav.cp.")).toBe(true);
      expect(typeof e.route).toBe("string");
      expect(e.route.startsWith("/cp/#/")).toBe(true);
    }
  });

  it("is deterministic (sorted by id)", async () => {
    const nav = await getCpNavCatalogDriven();
    const ids = nav.map(n => n.id);
    const sorted = [...ids].sort((a,b)=>a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });
});
