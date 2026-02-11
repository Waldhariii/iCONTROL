import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("CP users view: no inline style pipelines (contract)", () => {
  it("users.ts contains no inline styles (cssText / setAttribute('style') / style=\")", () => {
    const p = "src/surfaces/cp/users/Page.tsx";
    expect(fs.existsSync(p)).toBe(true);
    const s = fs.readFileSync(p, "utf8");
    const offenders: string[] = [];

    const patterns = [
      { re: /style\.cssText\s*=/g, label: "style.cssText" },
      { re: /setAttribute\(\s*["']style["']/g, label: "setAttribute('style')" },
      { re: /<[^>]+\sstyle="/g, label: 'style="' },
    ];

    for (const pat of patterns) {
      if (pat.re.test(s)) offenders.push(pat.label);
    }

    if (offenders.length) {
      throw new Error(`Inline styles detected in CP users view: ${offenders.join(", ")}. Use SSOT classes + --ic-* tokens.`);
    }
  });
});
