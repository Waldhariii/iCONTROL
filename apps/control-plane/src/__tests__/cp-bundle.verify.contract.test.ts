import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("CP bundle verify scripts (contract)", () => {
  it("verify script exists", () => {
    expect(fs.existsSync("tools/scripts/verify-cp-bundle.sh")).toBe(true);
    expect(fs.existsSync("tools/scripts/extract-cp-bundle.sh")).toBe(true);
  });
});
