import { execSync } from "node:child_process";
import { describe, it, expect } from "vitest";

function sh(cmd: string) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

describe("gate: generated-only (_audit must remain untracked)", () => {
  it("must not track any _audit files", () => {
    const tracked = sh("git ls-files _audit || true");
    expect(tracked).toBe("");
  });
});
