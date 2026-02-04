import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function scanFile(file: string): string[] {
  const base = path.basename(file);
  if (base.includes(".bak_")) return [];
  if (!/\.(ts|tsx)$/.test(base)) return [];
  const s = fs.readFileSync(file, "utf-8");
  const hits: string[] = [];
  const re = /\bstyle=\{\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const line = s.slice(0, m.index).split("\n").length;
    hits.push(`${file}:${line}`);
  }
  return hits;
}

describe("APP surfaces no-inline-styles (contract)", () => {
  it("surfaces/app has zero style={{...}}", () => {
    const root = path.resolve(__dirname, "..", "surfaces", "app");
    const files = walk(root);
    const hits = files.flatMap(scanFile);
    expect(hits, `Inline styles detected:\n${hits.join("\n")}`).toEqual([]);
  });
});
