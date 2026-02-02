import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function isSorted(arr: string[]) {
  for (let i = 1; i < arr.length; i++) {
    if (String(arr[i - 1]).localeCompare(String(arr[i])) > 0) return false;
  }
  return true;
}

describe("SSOT: MODULE_CATALOG.json (contract)", () => {
  it("is valid, deterministic, and non-empty", () => {
    const p = path.resolve(process.cwd(), "config/ssot/MODULE_CATALOG.json");
    expect(fs.existsSync(p)).toBe(true);

    const obj = JSON.parse(fs.readFileSync(p, "utf8"));
    expect(obj?.schema).toBe("MODULE_CATALOG_V1");
    expect(Array.isArray(obj?.modules)).toBe(true);
    expect(obj.modules.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    for (const m of obj.modules) {
      expect(typeof m.id).toBe("string");
      expect(m.id.length).toBeGreaterThan(0);
      expect(typeof m.manifest).toBe("string");
      expect(m.manifest.length).toBeGreaterThan(0);
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);

      for (const k of ["capabilities", "surfaces", "routes"] as const) {
        expect(Array.isArray(m[k])).toBe(true);
        expect(isSorted(m[k])).toBe(true);
        expect(new Set(m[k]).size).toBe(m[k].length);
      }
    }

    // Determinism: modules sorted by id then manifest
    const sorted = [...obj.modules].sort((a: any, b: any) =>
      String(a.id).localeCompare(String(b.id)) || String(a.manifest).localeCompare(String(b.manifest))
    );
    expect(obj.modules).toEqual(sorted);
  });
});
