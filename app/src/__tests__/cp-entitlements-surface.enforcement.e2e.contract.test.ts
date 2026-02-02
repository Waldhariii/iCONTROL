import { describe, it, expect } from "vitest";
import { enforceCpEntitlementsSurface } from "../core/ports/cpSurfaceEnforcement.entitlements";

describe("Move12: CP entitlements surface enforcement (e2e contract)", () => {
  it("denies when runtime identity is unavailable", async () => {
    (globalThis as any).__ICONTROL_RUNTIME__ = undefined;
    (globalThis as any).__ICONTROL_SESSION__ = undefined;
    (globalThis as any).__ICONTROL_DEVONLY__ = false;
    (globalThis as any).__ICONTROL_SAFE_MODE__ = false;

    const r = await enforceCpEntitlementsSurface({ appKind: "CP" });
    expect(r.allow).toBe(false);
    expect(String(r.reasonCode)).toMatch(/ERR_RUNTIME_IDENTITY_UNAVAILABLE/);
  });

  it("returns deterministic result shape (allow/deny + reasonCode)", async () => {
    // Provide deterministic identity
    (globalThis as any).__ICONTROL_RUNTIME__ = { tenantId: "t1", actorId: "admin1" };
    (globalThis as any).__ICONTROL_DEVONLY__ = false;
    (globalThis as any).__ICONTROL_SAFE_MODE__ = false;

    const r = await enforceCpEntitlementsSurface({ appKind: "CP" });
    expect(typeof r.allow).toBe("boolean");
    expect(typeof r.reasonCode).toBe("string");
    // redirectTo can be null or string
    expect(r.redirectTo === null || typeof r.redirectTo === "string").toBe(true);
  });
});
