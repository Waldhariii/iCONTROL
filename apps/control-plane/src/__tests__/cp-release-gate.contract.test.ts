import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("CP release gate (contract)", () => {
  it("package.json has cp:release:gate", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    expect(typeof pkg.scripts?.["cp:release:gate"]).toBe("string");
  });

  it("latest export index (if any) has marker", () => {
    const dir = "dist/exports";
    if (!fs.existsSync(dir)) return;
    const idx = fs.readdirSync(dir).filter(f => f.endsWith("_INDEX.md")).sort().pop();
    if (!idx) return;
    const s = fs.readFileSync(`${dir}/${idx}`, "utf8");
    expect(s.includes("ICONTROL_CP_EXPORT_INDEX_V1")).toBe(true);
  });
});
