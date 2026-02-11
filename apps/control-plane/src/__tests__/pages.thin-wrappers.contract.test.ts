import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && (p.endsWith(".ts") || p.endsWith(".tsx"))) out.push(p);
  }
  return out;
}

function scan(file: string): string[] {
  const s = fs.readFileSync(file, "utf-8");
  const hits: string[] = [];

  // hard bans in pages/*
  const bans: Array<[RegExp, string]> = [
    [/\buseState\b|\buseEffect\b|\buseMemo\b|\buseCallback\b/, "react hooks in pages/*"],
    [/\bstyle=\{\{/, "inline styles in pages/*"],
    [/\buse[A-Z]\w+\(/, "custom hook usage in pages/*"],
    [/\bfrom\s+["']\.\.\/core\/domain\//, "domain imports in pages/*"],
    [/\bfrom\s+["']\.\.\/core\/ports\//, "ports imports in pages/*"],
  ];

  for (const [re, label] of bans) {
    if (re.test(s)) hits.push(`${file}: ${label}`);
  }

  // must have an export default (wrapper)
  if (!/\bexport\s+default\s+/.test(s)) hits.push(`${file}: missing export default`);

  // must import from surfaces (canonical owner)
  if (!/\bfrom\s+["']\.\.\/\.\.\/surfaces\/|from\s+["']\.\.\/surfaces\//.test(s)) {
    hits.push(`${file}: does not import a canonical surface`);
  }

  return hits;
}

describe("pages are thin wrappers (contract)", () => {
  it("apps/control-plane/src/pages contains only wrappers (no domain logic, no inline styles)", () => {
    const root = path.resolve(__dirname, "..", "pages");
    const files = walk(root).filter(f => !f.includes("/_shared/"));
    const hits = files.flatMap(scan);
    expect(hits, `Non-wrapper pages detected:\\n${hits.join("\\n")}`).toEqual([]);
  });
});
