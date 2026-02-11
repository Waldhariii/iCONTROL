import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

function repoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

describe("Phase9 Move3: releaseops checklist generator", () => {
  it("generates a checklist under _audit (untracked)", () => {
    const root = repoRoot();
    const cmd = `node ${path.join(root, "scripts/gates/gen-releaseops-checklist.mjs")}`;
    const out = execSync(cmd, { encoding: "utf8" });
    expect(out).toContain("OK: wrote");

    const m = out.match(/OK: wrote (.+)\n?/);
    expect(m && m[1]).toBeTruthy();
    const fp = (m as any)[1].trim();
    expect(fs.existsSync(fp)).toBe(true);
  });
});
