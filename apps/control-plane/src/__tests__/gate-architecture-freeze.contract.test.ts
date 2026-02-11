import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";

function repoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

function mkFixture(prefix: string, roots: string[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `arch-freeze-${prefix}-`));
  for (const root of roots) {
    fs.mkdirSync(path.join(dir, root), { recursive: true });
  }
  return dir;
}

function runGate(fixtureRoot: string) {
  const gate = path.join(repoRoot(), "scripts", "gates", "gate-architecture-freeze.sh");
  return spawnSync("bash", [gate], {
    env: { ...process.env, ARCH_FREEZE_ROOT: fixtureRoot },
    encoding: "utf8",
  });
}

describe("gate:architecture-freeze (contract)", () => {
  it("passes when only tool artefact roots are present", () => {
    const fixture = mkFixture("tool-roots", ["app", ".cursor", ".claude-dev-helper", "_audit"]);
    try {
      const out = runGate(fixture);
      expect(out.status).toBe(0);
      expect(out.stdout).toContain("OK: gate-architecture-freeze");
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("fails when an unknown business root appears", () => {
    const fixture = mkFixture("unknown-root", ["app", "modules2"]);
    try {
      const out = runGate(fixture);
      expect(out.status).not.toBe(0);
      expect(`${out.stdout}${out.stderr}`).toContain(
        "ERR_ARCH_FREEZE: unknown root detected: modules2",
      );
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
});
