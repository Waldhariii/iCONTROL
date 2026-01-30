import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && p.endsWith(".ts")) out.push(p);
  }
  return out;
}

describe("CP: no inline styles anywhere (contract)", () => {
  it("no cssText / setAttribute('style') / style=\"...\" under src/pages/cp", () => {
    const root = path.join(process.cwd(), "src/pages/cp");
    expect(fs.existsSync(root)).toBe(true);

    const files = walk(root);
    const offenders: Array<{ file: string; hits: string[] }> = [];

    const re = /(style\.cssText\s*=|setAttribute\(\s*["']style["']|style\s*=\s*["'])/g;

    for (const f of files) {
      const s = fs.readFileSync(f, "utf8");
      const hits: string[] = [];
      const lines = s.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) hits.push(`L${i + 1}: ${lines[i].trim().slice(0, 200)}`);
        re.lastIndex = 0;
      }
      if (hits.length) offenders.push({ file: path.relative(process.cwd(), f), hits });
    }

    if (offenders.length) {
      const msg =
        `Inline styles detected in CP pages. Use SSOT classes + --ic-* tokens.\n` +
        offenders.map(o => `- ${o.file}\n  ${o.hits.join("\n  ")}`).join("\n");
      throw new Error(msg);
    }
  });
});
