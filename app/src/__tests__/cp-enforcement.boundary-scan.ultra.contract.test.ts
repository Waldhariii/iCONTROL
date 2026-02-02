import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function repoRoot(): string {
  return path.resolve(process.cwd(), "..");
}

function read(p: string): string {
  return fs.readFileSync(p, "utf8");
}

describe("ULTRA: boundary scan for CP enforcement stack", () => {
  it("no direct core-kernel imports in enforcement stack files", () => {
    const root = repoRoot();
    const rel = (p: string) => path.relative(root, p);

    const files = [
      "app/src/core/ports/index.ts",
      "app/src/core/ports/cpEnforcement.wiring.ts",
      "app/src/core/ports/cpEnforcement.bootstrap.ts",
      "app/src/core/ports/activationRegistry.facade.ts",
      "app/src/core/ports/policyEngine.facade.ts",
    ].map((p) => path.join(root, p));

    const forbidden = [
      "core-kernel/src",
      "../core-kernel",
      "../../core-kernel",
      "from \"core-kernel",
      "from 'core-kernel",
    ];

    const violations: string[] = [];
    for (const f of files) {
      if (!fs.existsSync(f)) continue;
      const txt = read(f);
      for (const pat of forbidden) {
        if (txt.includes(pat)) violations.push(`${rel(f)} :: ${pat}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
