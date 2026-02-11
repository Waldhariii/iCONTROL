import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("CP RC index (contract)", () => {
  it("latest RC index has marker when present", () => {
    const dir = path.join(process.cwd(), "dist", "exports");
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith("_INDEX.md") && f.includes("_EXPORT_")).sort();
    if (!files.length) return;
    const p = path.join(dir, files[files.length - 1]);
    const s = fs.readFileSync(p, "utf8");
    expect(s.includes("ICONTROL_CP_RC_INDEX_V1")).toBe(true);
  });
});
