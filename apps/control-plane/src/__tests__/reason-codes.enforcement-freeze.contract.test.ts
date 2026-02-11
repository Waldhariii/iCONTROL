import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { REASON_CODES_V1 } from "../core/ports/reasonCodes.v1";

// Scan the same surface area as the build script, but inside the test runner.
// This becomes an always-on guardrail in CI: no new reason codes slip in silently.
const CODE_RE = /\b(OK|ERR|WARN)_[A-Z0-9_]+\b/g;

function repoRoot(): string {
  // app/ is workspace; tests run from app/ cwd in vitest wrapper
  // Resolve to monorepo root via ../
  return path.resolve(process.cwd(), "..");
}

function walk(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === "_artifacts" || e.name === "_audit" || e.name === "dist") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function scanReasonCodes(files: string[]): Set<string> {
  const found = new Set<string>();
  for (const file of files) {
    // keep scope tight: TS/JS/MD/JSON are enough
    if (!/\.(ts|tsx|js|mjs|cjs|md|json)$/.test(file)) continue;
    const txt = fs.readFileSync(file, "utf8");
    let m: RegExpExecArray | null;
    while ((m = CODE_RE.exec(txt))) found.add(m[0]);
  }
  return found;
}

describe("Governance: Reason codes enforcement freeze (v1)", () => {
  it("has a non-empty registry", () => {
    expect(Array.isArray(REASON_CODES_V1)).toBe(true);
    expect(REASON_CODES_V1.length).toBeGreaterThan(0);
  });

  it("rejects any new reason codes in enforcement surface area unless registry updated", () => {
    const root = repoRoot();

    const targets = [
      path.join(root, "apps/control-plane/src/core/ports"),
      path.join(root, "apps/control-plane/src/core/write-gateway"),
      path.join(root, "apps/control-plane/src/__tests__"),
      path.join(root, "apps/control-plane/src/core/kernel/src/contracts"),
      path.join(root, "apps/control-plane/src/core/kernel/src/policy"),
      path.join(root, "apps/control-plane/src/core/kernel/domain/errors"),
    ];

    const files = targets.flatMap(walk).filter((f) => {
      // Keep the scan focused to enforcement / CP wiring tests
      if (f.includes(`${path.sep}app${path.sep}src${path.sep}__tests__${path.sep}`)) {
        return path.basename(f).startsWith("cp-enforcement") || path.basename(f).startsWith("reason-codes.");
      }
      return true;
    });

    const found = scanReasonCodes(files);
    const allowed = new Set<string>(REASON_CODES_V1 as unknown as string[]);

    const unknown: string[] = [];
    for (const code of found) if (!allowed.has(code)) unknown.push(code);

    unknown.sort();
    if (unknown.length) {
      const msg =
        "New reason codes detected (update reasonCodes.v1.ts + RFC_CORE_CHANGES.md):\n" +
        unknown.map((x) => `- ${x}`).join("\n");
      throw new Error(msg);
    }

    // Extra: keep registry sorted & unique (reduces churn)
    const sorted = [...allowed].slice().sort();
    expect([...allowed]).toEqual(sorted);
  });
});
