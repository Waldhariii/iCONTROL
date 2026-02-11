import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

function repoRoot(): string {
  const out = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  return out;
}

describe("gate:releaseops-invariants (contract)", () => {
  it("passes on current repo (contract should hold)", () => {
    const root = repoRoot();
    const cmd = `node ${path.join(root, "scripts/gates/check-releaseops-invariants.mjs")}`;
    const out = execSync(cmd, { encoding: "utf8" });
    expect(out).toContain("OK:");
  });
});
