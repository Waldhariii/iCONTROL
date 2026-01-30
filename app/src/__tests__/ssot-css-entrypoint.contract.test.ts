import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function walk(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (
        e.name === "node_modules" ||
        e.name === "dist" ||
        e.name === ".vite" ||
        e.name === ".git" ||
        e.name === "_backups"
      ) continue;
      out.push(...walk(p));
    } else {
      out.push(p);
    }
  }
  return out;
}

function isIgnoredFile(file: string): boolean {
  const f = file.replace(/\\/g, "/");
  return (
    f.includes(".disabled") ||
    f.includes(".deleted") ||
    f.includes(".bak") ||
    f.endsWith(".d.ts")
  );
}

function stripComments(ts: string): string {
  // Remove block comments and line comments (best-effort; good enough for contract scanning)
  const noBlock = ts.replace(/\/\*[\s\S]*?\*\//g, "");
  const noLine = noBlock.replace(/(^|[^:])\/\/.*$/gm, "$1"); // keep "http://"
  return noLine;
}

describe("SSOT CSS entrypoint (contract)", () => {
  it("only src/main.ts may import .css (prevents parallel style pipelines)", () => {
    const root = process.cwd();
    const srcDir = path.join(root, "src");
    const files = walk(srcDir).filter((p) => p.endsWith(".ts") || p.endsWith(".tsx"));

    const offenders: Array<{ file: string; lines: string[] }> = [];

    for (const file of files) {
      if (isIgnoredFile(file)) continue;

      const rel = path.relative(root, file).replace(/\\/g, "/");
      const isMain = rel === "src/main.ts" || rel === "src/main.tsx";
      const raw = fs.readFileSync(file, "utf8");
      const txt = stripComments(raw);

      const hits = txt
        .split("\n")
        .map((line, idx) => ({ line, idx: idx + 1 }))
        .filter(({ line }) =>
          /import\s+["'][^"']+\.css["'];?/.test(line) ||
          /import\s+.*\s+from\s+["'][^"']+\.css["'];?/.test(line)
        )
        .map(({ line, idx }) => `L${idx}: ${line.trim()}`);

      if (hits.length > 0 && !isMain) {
        offenders.push({ file: rel, lines: hits });
      }
    }

    if (offenders.length) {
      const msg =
        "\nSSOT violation: CSS imports outside src/main.ts detected.\n" +
        offenders.map(o => `- ${o.file}\n  ${o.lines.join("\n  ")}`).join("\n") +
        "\n\nPolicy: Only src/main.ts may import .css. Use CSS vars/classes via SSOT tokens.\n";
      expect.fail(msg);
    }

    expect(true).toBe(true);
  });
});
