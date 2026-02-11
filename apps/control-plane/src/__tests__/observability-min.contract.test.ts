import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

describe("gate:observability-min (contract)", () => {
  it("passes on repo", () => {
    const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
    const out = execSync(`node ${path.join(root, "scripts/gates/check-observability-min.mjs")}`, { encoding: "utf8" });
    expect(out).toContain("OK:");
  });
});
