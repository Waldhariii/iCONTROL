import { describe, it, expect } from "vitest";
import { buildActorContext } from "../platform/securityContext";
import { guardAdminEntitlements, guardAdminGlobalTheme } from "../platform/guards/adminGuards";

describe("policy capabilities (contract)", () => {
  it("free+user cannot admin entitlements", () => {
    const actor = buildActorContext({ tenantId: "t1", role: "user" });
    const d = guardAdminEntitlements(actor);
    expect(d.allow).toBe(false);
    expect(d.reasonCode).toMatch(/ERR_POLICY_ADMIN_ENTITLEMENTS_DENIED/);
  });

  it("admin can admin entitlements and theme (current policy)", () => {
    const actor = buildActorContext({ tenantId: "t1", role: "admin" });
    expect(guardAdminEntitlements(actor).allow).toBe(true);
    expect(guardAdminGlobalTheme(actor).allow).toBe(true);
  });
});
