import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

function repoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

describe("gate:ssot-surface-route-map (contract)", () => {
  it("passes on current repo", () => {
    const root = repoRoot();
    const cmd = `node ${path.join(root, "scripts/gates/check-ssot-surface-route-map.mjs")}`;
    const out = execSync(cmd, { encoding: "utf8" });
    expect(out).toContain("OK:");
  });
});
