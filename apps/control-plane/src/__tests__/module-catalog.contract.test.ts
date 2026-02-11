import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const REPO_ROOT = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const MODULE_CATALOG_PATH = path.join(REPO_ROOT, "runtime/configs/ssot/MODULE_CATALOG.json");

function isSorted(arr: string[]) {
  for (let i = 1; i < arr.length; i++) {
    if (String(arr[i - 1]).localeCompare(String(arr[i])) > 0) return false;
  }
  return true;
}

describe("SSOT: MODULE_CATALOG.json (contract)", () => {
  it("is valid, deterministic, and non-empty", () => {
    expect(fs.existsSync(MODULE_CATALOG_PATH)).toBe(true);

    const obj = JSON.parse(fs.readFileSync(MODULE_CATALOG_PATH, "utf8"));
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

    const sorted = [...obj.modules].sort((a: any, b: any) =>
      String(a.id).localeCompare(String(b.id)) || String(a.manifest).localeCompare(String(b.manifest))
    );
    expect(obj.modules).toEqual(sorted);
  });
});
