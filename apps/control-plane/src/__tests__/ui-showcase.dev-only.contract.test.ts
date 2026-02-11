import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe.skip("UI showcase (contract)", () => {
  it("remains DEV-only by convention (no production-critical imports)", () => {
    const p = "src/surfaces/cp/ui-showcase.ts";
    const s = fs.readFileSync(p, "utf8");
    // Contract: keep it isolated; no imports from core/runtime/ or policies/ that could create side effects.
    expect(s.includes("ICONTROL_UI_SHOWCASE_V2")).toBe(true);
    expect(s).not.toMatch(/from\s+["']\.\.\/\.\.\/core\/runtime\//);
    expect(s).not.toMatch(/from\s+["']\.\.\/\.\.\/policies\//);
  });
});
