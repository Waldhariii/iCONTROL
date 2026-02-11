import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("UI consumes entitlements facade (enterprise-free baseline)", () => {
  it("Account page references getEntitlementsForTenant via _shared/entitlements facade", () => {
    const repo = path.resolve(process.cwd(), "..");
    const target = path.join(repo, "modules/core-system/ui/frontend-ts/pages/account/index.ts");
    const src = fs.readFileSync(target, "utf8");
    expect(src.includes("getEntitlementsForTenant")).toBe(true);
    expect(src.includes("ICONTROL_ENTITLEMENTS_WIRING_V1")).toBe(true);
  });
});
