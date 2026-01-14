import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function walk(dir: string, out: string[] = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (p.endsWith(".ts") || p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("Runtime import hygiene (contract)", () => {
  it("does not import runtime/studioRuntime directly outside runtime package", () => {
    const root = path.resolve(process.cwd(), "src");
    const files = walk(root);

    const bad: string[] = [];
    for (const f of files) {
      // Allow within runtime package itself
      const rel = path.relative(root, f).replace(/\\/g, "/");
      if (rel.startsWith("core/studio/runtime/")) continue;
      if (rel === "__tests__/runtime-import-hygiene.contract.test.ts") continue;

      const txt = fs.readFileSync(f, "utf8");
      if (
        txt.includes('from "../core/studio/runtime/studioRuntime"') ||
        txt.includes('from "../../core/studio/runtime/studioRuntime"') ||
        txt.includes('from "../../../core/studio/runtime/studioRuntime"') ||
        txt.includes('from "../core/studio/runtime/studioRuntime.ts"') ||
        txt.includes('from "../../core/studio/runtime/studioRuntime.ts"') ||
        txt.includes('from "../../../core/studio/runtime/studioRuntime.ts"')
      ) {
        bad.push(rel);
      }
    }

    expect(
      bad,
      `Direct studioRuntime imports detected:\n- ${bad.join("\n- ")}`,
    ).toEqual([]);
  });
});
