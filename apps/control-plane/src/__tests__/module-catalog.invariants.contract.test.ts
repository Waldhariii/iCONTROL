import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

type CatalogModule = {
  id: string;
  name?: string;
  version?: string;
  enabledByDefault?: boolean;
  surfaces?: string[];
  routes?: string[];
  capabilities?: string[];
  manifestPath?: string;
};

function repoRoot(): string {
  // Robust vs Vitest cwd (often app/)
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

function readJson<T>(p: string): T {
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as T;
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((s) => typeof s === "string");
}

function listModuleManifests(root: string): string[] {
  const modulesDir = path.join(root, "modules");
  if (!fs.existsSync(modulesDir)) return [];

  const out: string[] = [];
  const entries = fs.readdirSync(modulesDir, { withFileTypes: true });

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    // Skip internal dirs/templates
    if (e.name.startsWith("_")) continue;

    const mp = path.join(modulesDir, e.name, "manifest", "module.json");
    if (fs.existsSync(mp)) out.push(mp);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

describe("SSOT: MODULE_CATALOG invariants (ULTRA contract)", () => {
  it("MODULE_CATALOG.json exists and has a stable, well-formed shape", () => {
    const root = repoRoot();
    const p = path.join(root, "config", "ssot", "MODULE_CATALOG.json");
    expect(fs.existsSync(p)).toBe(true);

    const obj = readJson<{ version?: string; generatedAt?: string; modules: CatalogModule[] }>(p);
    expect(obj).toBeTruthy();
    expect(Array.isArray(obj.modules)).toBe(true);
    expect(obj.modules.length).toBeGreaterThan(0);

    // Unique ids
    const ids = obj.modules.map((m) => m.id);
    expect(ids.every(isNonEmptyString)).toBe(true);
    const uniq = new Set(ids);
    expect(uniq.size).toBe(ids.length);

    // Type discipline
    for (const m of obj.modules) {
      expect(isNonEmptyString(m.id)).toBe(true);
      if (m.surfaces != null) expect(isStringArray(m.surfaces)).toBe(true);
      if (m.routes != null) expect(isStringArray(m.routes)).toBe(true);
      if (m.capabilities != null) expect(isStringArray(m.capabilities)).toBe(true);
      if (m.manifestPath != null) expect(isNonEmptyString(m.manifestPath)).toBe(true);
    }
  });

  it("Catalog entries that declare manifestPath must resolve inside repo and match manifest.id", () => {
    const root = repoRoot();
    const catalogPath = path.join(root, "config", "ssot", "MODULE_CATALOG.json");
    const cat = readJson<{ modules: CatalogModule[] }>(catalogPath);

    for (const m of cat.modules) {
      if (!m.manifestPath) continue;

      const abs = path.isAbsolute(m.manifestPath)
        ? m.manifestPath
        : path.join(root, m.manifestPath);

      expect(abs.startsWith(root)).toBe(true);
      expect(fs.existsSync(abs)).toBe(true);

      const man = readJson<{ id?: string; capabilities?: unknown }>(abs);
      expect(isNonEmptyString(man.id)).toBe(true);
      expect(man.id).toBe(m.id);

      // If manifest defines capabilities, catalog capabilities must be a superset (or equal)
      if (Array.isArray(man.capabilities)) {
        const manCaps = man.capabilities.filter((x) => typeof x === "string") as string[];
        const catCaps = Array.isArray(m.capabilities) ? m.capabilities : [];
        for (const c of manCaps) {
          expect(catCaps.includes(c)).toBe(true);
        }
      }
    }
  });

  it("All module manifests are either represented in catalog OR explicitly exempted (no silent drift)", () => {
    const root = repoRoot();
    const catalogPath = path.join(root, "config", "ssot", "MODULE_CATALOG.json");
    const cat = readJson<{ modules: CatalogModule[] }>(catalogPath);

    const catalogIds = new Set(cat.modules.map((m) => m.id));
    const manifests = listModuleManifests(root);

    // Optional exemptions file (business-controlled escape hatch)
    const exPath = path.join(root, "config", "ssot", "MODULE_CATALOG_EXEMPTIONS.json");
    const exemptions: string[] = fs.existsSync(exPath)
      ? readJson<{ exempt_module_ids?: string[] }>(exPath).exempt_module_ids ?? []
      : [];

    const exempt = new Set(exemptions);

    const missing: { id: string; path: string }[] = [];
    for (const mp of manifests) {
      const man = readJson<{ id?: string }>(mp);
      const id = (man.id ?? "").toString();
      if (!id) continue;

      if (!catalogIds.has(id) && !exempt.has(id)) {
        missing.push({ id, path: mp.replace(root + path.sep, "") });
      }
    }

    // High-signal failure: forces governance decision (catalog update vs exemption)
    expect(missing, `Missing from MODULE_CATALOG (and not exempted):\n${missing.map(x => `- ${x.id} @ ${x.path}`).join("\n")}\n`).toEqual([]);
  });
});
