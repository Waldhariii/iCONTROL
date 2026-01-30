import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { isDevOnlyAllowed } from "../core/policies/devOnly";

describe("ui-showcase runtime DEV-only (contract)", () => {
  it("devOnly helper is deterministic and returns boolean", () => {
    const v = isDevOnlyAllowed();
    expect(typeof v).toBe("boolean");
  });

  it("ui-showcase has runtime guard marker", () => {
    const p = "src/pages/cp/ui-showcase.ts";
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p, "utf8");
    expect(s.includes("ICONTROL_UI_SHOWCASE_DEV_ONLY_RUNTIME_GUARD")).toBe(true);
  });

  it("ui-showcase contains no inline style pipelines", () => {
    const p = "src/pages/cp/ui-showcase.ts";
    const s = fs.readFileSync(p, "utf8");
    expect(/setAttribute\(\s*["']style["']/.test(s)).toBe(false);
    expect(/style\.cssText\s*=/.test(s)).toBe(false);
    expect(/style\s*=\s*["']/.test(s)).toBe(false);
  });
});
