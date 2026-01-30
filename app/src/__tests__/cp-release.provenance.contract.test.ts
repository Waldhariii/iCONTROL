import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("CP release/provenance docs (contract)", () => {
  it("generator exists", () => {
    expect(fs.existsSync("tools/scripts/gen-cp-release-notes.mjs")).toBe(true);
  });
});
