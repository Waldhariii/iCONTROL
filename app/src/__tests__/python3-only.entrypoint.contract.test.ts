import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

function findRepoRoot(startDir: string) {
  let dir = startDir;
  for (let i = 0; i < 20; i++) {
    const p = path.join(dir, "package.json");
    if (fs.existsSync(p)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
        const scripts = pkg?.scripts ?? {};
        const hasSignals =
          typeof scripts["gate:ssot"] === "string" ||
          typeof scripts["gate:ui-drift"] === "string" ||
          typeof scripts["gate:python3-only"] === "string";
        if (hasSignals) return dir;
      } catch {}
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function hasPython3OnlyPrefix(s: string) {
  const t = s.trim();
  return (
    t.startsWith("npm run -s gate:python3-only &&") ||
    t.startsWith("npm run gate:python3-only &&")
  );
}

describe("python3-only gate (entrypoint contract)", () => {
  it("entrypoint (root or app) is prefixed with gate:python3-only", () => {
    const cwd = process.cwd();
    const root = findRepoRoot(cwd);

    const rootPkgPath = path.join(root, "package.json");
    expect(fs.existsSync(rootPkgPath)).toBe(true);

    const rootPkg = readJson(rootPkgPath);
    const rootScripts = rootPkg?.scripts ?? {};

    // On veut couvrir le vrai “orchestrator” (priorité: SSOT)
    const preferredKeys = [
      "gate:ssot",
      "gate:ui-drift",
      "gate:pre-commit",
      "gate:all",
      "cp:release:gate",
      "gate:cp",
      "release:manifest",
    ];

    let targetCmd: string | undefined;
    let targetKey: string | undefined;
    let where = "root";

    for (const k of preferredKeys) {
      if (typeof rootScripts[k] === "string") {
        targetCmd = rootScripts[k];
        targetKey = k;
        break;
      }
    }

    if (!targetCmd) {
      const appPkgPath = path.join(root, "app", "package.json");
      expect(fs.existsSync(appPkgPath)).toBe(true);
      const appPkg = readJson(appPkgPath);
      const appScripts = appPkg?.scripts ?? {};
      where = "app";

      for (const k of preferredKeys) {
        if (typeof appScripts[k] === "string") {
          targetCmd = appScripts[k];
          targetKey = k;
          break;
        }
      }
    }

    expect(typeof targetCmd).toBe("string");
    expect(typeof targetKey).toBe("string");

    const s = String(targetCmd);
    // Contract: python3-only doit être exécuté en amont (prefix strict)
    expect(hasPython3OnlyPrefix(s)).toBe(true);

    // Diagnostic léger
    expect(where === "root" || where === "app").toBe(true);
  });
});
