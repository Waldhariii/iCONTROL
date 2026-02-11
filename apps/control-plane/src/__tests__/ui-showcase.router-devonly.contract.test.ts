import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe.skip("CP ui-showcase router-level DEV-only (contract)", () => {
  it("router.ts contains ui-showcase DEV-only guard marker + check", () => {
    const p = "src/router.ts";
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p, "utf8");
    expect(s.includes("ICONTROL_CP_UI_SHOWCASE_ROUTER_GUARD")).toBe(true);
    expect(s.includes("ui-showcase")).toBe(true);
    expect(s.includes("isDevOnlyAllowed")).toBe(true);
  });
});
