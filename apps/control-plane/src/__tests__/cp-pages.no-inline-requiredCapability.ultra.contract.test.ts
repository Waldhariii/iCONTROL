import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe("ULTRA: CP pages must not declare requiredCapability inline", () => {
  it("no Page.tsx contains 'requiredCapability:'", () => {
    const root = path.resolve(__dirname, "..", "surfaces", "cp");
    if (!fs.existsSync(root)) return;
    const pages = walk(root).filter((p) => p.endsWith("Page.tsx"));
    const offenders: string[] = [];
    for (const p of pages) {
      const s = fs.readFileSync(p, "utf8");
      if (s.includes("requiredCapability:")) offenders.push(p);
    }
    expect(offenders).toEqual([]);
  });
});
