import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function repoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

describe("Phase9 Move1: cp.operator is present in MODULE_CATALOG", () => {
  it("catalog contains cp.operator surface and /cp/#/operator route", () => {
    const root = repoRoot();
    const p = path.join(root, "runtime/configs/ssot/MODULE_CATALOG.json");
    const cat = JSON.parse(fs.readFileSync(p, "utf8"));
    const mods = cat.modules || [];
    const surfaces = mods.flatMap((m: any) => Array.isArray(m.surfaces) ? m.surfaces : []);
    const routes = mods.flatMap((m: any) => Array.isArray(m.routes) ? m.routes : []);
    expect(surfaces).toContain("cp.operator");
    expect(routes).toContain("/cp/#/operator");
  });
});
