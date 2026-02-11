// @ts-nocheck
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(p));
    } else if (entry.isFile()) {
      out.push(p);
    }
  }
  return out;
}

describe("role policy (UI pages)", () => {
  it("does not contain deprecated role token in UI pages", () => {
    const root = path.resolve(process.cwd(), "..", "modules", "core-system", "ui", "frontend-ts", "pages");
    const files = collectFiles(root);
    const needle = ["USER", "_", "READONLY"].join("");
    const hits = files
      .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
      .filter((f) => fs.readFileSync(f, "utf8").includes(needle));
    expect(hits.length).toBe(0);
  });
});
