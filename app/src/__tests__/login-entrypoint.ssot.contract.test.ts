// Contract: SSOT Login Entrypoint (ICONTROL_LOGIN_ENTRYPOINT_SSOT_V1)
// - moduleLoader doit router le rid "login" vers login.ts (pas loginPage.ts)
// - aucun import runtime ne doit référencer loginPage.ts (legacy) comme entrypoint

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string): string {
  const abs = path.resolve(process.cwd(), rel);
  return fs.readFileSync(abs, "utf8");
}

function listFiles(rootRel: string): string[] {
  const rootAbs = path.resolve(process.cwd(), rootRel);
  const out: string[] = [];
  const stack = [rootAbs];
  while (stack.length) {
    const d = stack.pop()!;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) {
        // ignore heavy dirs
        if (
          ent.name === "node_modules" ||
          ent.name === "dist" ||
          ent.name === "target" ||
          ent.name === ".git"
        )
          continue;
        stack.push(p);
      } else {
        out.push(p);
      }
    }
  }
  return out;
}

describe("contract: SSOT login entrypoint", () => {
  it("moduleLoader routes rid=login to login.ts (no loginPage.ts entrypoint)", () => {
    const ml = read("src/moduleLoader.ts");
    expect(ml).toMatch(/rid.*===\s*["']login["']/);
    // ensure the login route imports the expected module (login.ts)
    expect(ml).toMatch(/pages\/login["']/);
    // hard block legacy entrypoint
    expect(ml).not.toMatch(/loginPage/);
  });

  it("no runtime import references loginPage.ts as a login entrypoint", () => {
    const roots = ["src", "../modules/core-system/ui/frontend-ts/pages"];

    const offenders: string[] = [];
    for (const r of roots) {
      for (const fAbs of listFiles(r)) {
        if (!fAbs.endsWith(".ts") && !fAbs.endsWith(".tsx")) continue;
        const rel = path.relative(process.cwd(), fAbs);
        // tests are allowed to mention strings; we only guard runtime surfaces
        if (rel.includes("__tests__") || rel.includes(".test.")) continue;

        const src = fs.readFileSync(fAbs, "utf8");
        // "loginPage" mention is only tolerated inside loginPage.ts itself (legacy file)
        if (src.includes("loginPage") && !rel.endsWith("loginPage.ts")) {
          offenders.push(rel);
        }
      }
    }

    expect(
      offenders,
      `Unexpected loginPage references:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
