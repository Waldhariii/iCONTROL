import { describe, it, expect } from "vitest";
import { buildCpSurfaceRegistryFromCatalog, listCpSurfaceIdsFromCatalog } from "../core/ports/cpSurfaceRegistry.catalog";

describe("Move3: catalog-driven CP surface registry (contract)", () => {
  it("builds non-empty deterministic registry and normalizes cp.* surface ids", () => {
    const entries = buildCpSurfaceRegistryFromCatalog();
    expect(entries.length).toBeGreaterThan(0);

    // deterministic ordering
    const sig = entries.map((e) => `${e.surfaceId}::${e.moduleId}`);
    expect(sig).toEqual([...sig].sort((a, b) => a.localeCompare(b)));

    for (const e of entries) {
      expect(e.surfaceId.startsWith("cp.")).toBe(true);
      expect(e.surfaceId).toEqual(e.surfaceId.toLowerCase());
      expect(typeof e.moduleId).toBe("string");
      expect(e.moduleId.length).toBeGreaterThan(0);
      expect(Array.isArray(e.routes)).toBe(true);
      expect(Array.isArray(e.capabilities)).toBe(true);
    }
  });

  it("surface ids list is unique + sorted", () => {
    const ids = listCpSurfaceIdsFromCatalog();
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toEqual(Array.from(new Set(ids)));
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
  });
});
