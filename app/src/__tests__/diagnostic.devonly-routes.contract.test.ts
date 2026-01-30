import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("diagnostic surface exposes DEV-only routes (contract)", () => {
  it("diagnostic source has marker", () => {
    const candidates = ["src/dev/diagnostic.ts", "src/dev/diagnostic.tsx", "src/dev/diagnostic.js"];
    const p = candidates.find(x => fs.existsSync(x));
    expect(!!p).toBe(true);
    const s = fs.readFileSync(p!, "utf8");
    expect(s.includes("ICONTROL_DIAG_DEVONLY_ROUTES_V1")).toBe(true);
  });

  it("DEV-only routes doc exists (docgen pipeline)", () => {
    expect(fs.existsSync("docs/DEV_ONLY_ROUTES.md")).toBe(true);
  });
});
