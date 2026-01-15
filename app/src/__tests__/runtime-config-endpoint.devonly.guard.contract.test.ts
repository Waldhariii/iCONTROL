import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Runtime config endpoint shim dev-only (guard)", () => {
  it("must contain explicit DEV-only gating", () => {
    const file = path.join(
      process.cwd(),
      "src/core/runtime/runtimeConfigEndpoint.ts",
    );
    const txt = fs.readFileSync(file, "utf8");
    // Accept either import.meta.env.DEV or hostname check; require at least one.
    expect(
      txt.includes("import.meta") ||
        txt.includes("localhost") ||
        txt.includes("127.0.0.1"),
    ).toBe(true);
    // Require strict path check
    expect(txt.includes('url.pathname === "/cp/api/runtime-config"')).toBe(
      true,
    );
  });
});
