import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function repoRoot(): string {
  // vitest cwd is app/ in this repo wrapper; resolve monorepo root.
  return path.resolve(process.cwd(), "..");
}

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

function mustExist(p: string) {
  if (!fs.existsSync(p)) throw new Error("Missing file: " + p);
}

describe("Governance: CP enforcement wiring stays boundary-safe", () => {
  it("bootstrap/wiring/facades do not import core-kernel directly", () => {
    const root = repoRoot();

    const files = [
      path.join(root, "app/src/core/ports/cpEnforcement.wiring.ts"),
      path.join(root, "app/src/core/ports/cpEnforcement.bootstrap.ts"),
      path.join(root, "app/src/core/ports/activationRegistry.facade.ts"),
      path.join(root, "app/src/core/ports/policyEngine.facade.ts"),
    ];

    for (const f of files) mustExist(f);

    const forbidden = [
      "core-kernel/src",
      "../core-kernel",
      "../../core-kernel",
      "from \"core-kernel",
      "from 'core-kernel",
    ];

    const violations: string[] = [];
    for (const f of files) {
      const txt = read(f);
      for (const pat of forbidden) {
        if (txt.includes(pat)) violations.push(`${path.relative(root, f)} :: ${pat}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
