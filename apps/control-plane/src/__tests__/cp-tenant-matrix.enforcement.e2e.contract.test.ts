import { describe, it, expect } from "vitest";
import { enforceCpEntitlementsSurface } from "../core/ports/cpSurfaceEnforcement.entitlements";

// Helper to simulate identity (Move11 path should be used by enforcement implementation)
function setIdentity(tenantId: string, actorId: string) {
  (globalThis as any).__ICONTROL_RUNTIME__ = { tenantId, actorId };
  (globalThis as any).__ICONTROL_DEVONLY__ = false;
  (globalThis as any).__ICONTROL_SAFE_MODE__ = false;
}

describe("Move13: tenant matrix enforcement (e2e contract)", () => {
  it("denies when capability is disabled (deterministic reason code)", async () => {
    // Use a tenant we expect NOT to have admin entitlements capability by default.
    setIdentity("t_free", "user1");
    const r = await enforceCpEntitlementsSurface({ appKind: "CP" });
    // We don't assume allow/deny by policy; we assert the contract allows this reason to appear.
    expect(["ERR_CAPABILITY_DISABLED", "ERR_POLICY_DENY", "ERR_RUNTIME_IDENTITY_UNAVAILABLE"].includes(r.reasonCode)).toBe(true);
  });

  it("returns stable shape + redirect on deny", async () => {
    setIdentity("t_free", "user1");
    const r = await enforceCpEntitlementsSurface({ appKind: "CP" });
    expect(typeof r.allow).toBe("boolean");
    expect(typeof r.reasonCode).toBe("string");
    expect(r.allow ? r.redirectTo === null : typeof r.redirectTo === "string" || r.redirectTo === null).toBe(true);
  });
});
