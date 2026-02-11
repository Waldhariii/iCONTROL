import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("UI pages consume entitlements facade (enterprise baseline)", () => {
  it("dashboard page references getEntitlementsForTenant via _shared/entitlements facade", () => {
    const repo = path.resolve(process.cwd(), ".."); // vitest runs in app/
    const target = path.join(repo, "modules/core-system/ui/frontend-ts/pages/dashboard.ts");
    const src = fs.readFileSync(target, "utf8");
    expect(src.includes("getEntitlementsForTenant")).toBe(true);
    expect(src.includes("ICONTROL_ENTITLEMENTS_WIRING_DASHBOARD_V1")).toBe(true);
  });

  it("users page references getEntitlementsForTenant via _shared/entitlements facade", () => {
    const repo = path.resolve(process.cwd(), ".."); // vitest runs in app/
    const target = path.join(repo, "modules/core-system/ui/frontend-ts/pages/users/index.ts");
    const src = fs.readFileSync(target, "utf8");
    expect(src.includes("getEntitlementsForTenant")).toBe(true);
    expect(src.includes("ICONTROL_ENTITLEMENTS_WIRING_USERS_V1")).toBe(true);
  });
});
