import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("UI modal primitive (contract)", () => {
  it("modal primitive exists", () => {
    const p = "src/core/ui/modal.ts";
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p, "utf8");
    expect(s.includes("ICONTROL_UI_MODAL_V1")).toBe(true);
    expect(s.includes("showModal")).toBe(true);
  });
});
