import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("DEV-only routes docgen (contract)", () => {
  it("generator exists and has version marker", () => {
    const p = "tools/scripts/gen-devonly-routes-doc.mjs";
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p,"utf8");
    expect(s.includes("DEV_ONLY_ROUTES_DOC_V1")).toBe(true);
  });
});
