import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

function listModulesRoot(): string[] {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const root = path.join(repoRoot, "modules");
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(n => !["_module-template", "_manifests"].includes(n));
}

describe("Module manifest contract (V1)", () => {
  it("every module has manifest/module.json with schema_version V1 and id", () => {
    const mods = listModulesRoot();
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
    for (const m of mods) {
      const p = path.join(repoRoot, "modules", m, "manifest", "module.json");
      expect(fs.existsSync(p), `missing: ${p}`).toBe(true);
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      expect(j.schema_version).toBe("MODULE_MANIFEST_SCHEMA_V1");
      expect(typeof j.id).toBe("string");
      expect(j.id.length).toBeGreaterThan(0);
    }
  });
});
