import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(p: string) {
  return fs.readFileSync(p, "utf-8");
}

describe("Governance: navigation is centralized", () => {
  it("no direct location.hash writes in critical modules (use navigate())", () => {
    const root = path.resolve(process.cwd(), ".."); // app/ -> repo root

    // Critical modules: must not directly write location.hash.
    // Single exception: apps/control-plane/src/runtime/navigate.ts is the write-gateway.
    const files = [
      "apps/control-plane/src/runtime/navigate.ts",
      "apps/control-plane/src/router.ts",
      "apps/control-plane/src/localAuth.ts",
      "modules/core-system/ui/frontend-ts/pages/dashboard.ts",
      "modules/core-system/ui/frontend-ts/pages/login.ts",
      "modules/core-system/ui/frontend-ts/pages/settings/branding.ts",
      "modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts",
    ]
      .map((f) => path.join(root, f))
      .filter((p) => fs.existsSync(p));

    const offenders: string[] = [];
    for (const f of files) {
      const src = read(f);
      if (src.includes("location.hash =") || src.includes("window.location.hash =")) {
        offenders.push(f);
      }
    }

    // Allowed: navigate.ts is the single write-gateway for location.hash
    const cleaned = offenders.filter((p) => !p.endsWith("apps/control-plane/src/runtime/navigate.ts"));

    expect(cleaned, `Direct location.hash writes detected:\n${cleaned.join("\n")}`).toEqual([]);
  });
});
