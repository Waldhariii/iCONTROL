import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(p: string) {
  return fs.readFileSync(p, "utf-8");
}

describe("Governance: navigation is centralized", () => {
  it("no direct location.hash writes in critical modules (use navigate())", () => {
    const root = path.resolve(process.cwd(), ".."); // app/ -> repo root
    const files = [
      "app/src/runtime/router.ts",
      "app/src/router.ts",
      "app/src/localAuth.ts",
      "modules/core-system/ui/frontend-ts/pages/dashboard.ts",
      "modules/core-system/ui/frontend-ts/pages/login.ts",
      "modules/core-system/ui/frontend-ts/pages/settings/branding.ts",
      "modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts",
    ].map((f) => path.join(root, f)).filter((p) => fs.existsSync(p));

    const offenders: string[] = [];
    for (const f of files) {
      const src = read(f);
      if (src.includes("location.hash =") || src.includes("window.location.hash =")) {
        // Allow only if file is the canonical navigate implementation (it isn't in this list)
        offenders.push(f);
      }
    }

    expect(offenders, `Direct location.hash writes detected:\\n${offenders.join("\n")}`).toEqual([]);
  });
});
