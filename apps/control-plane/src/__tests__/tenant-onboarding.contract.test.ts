import { describe, it, expect } from "vitest";
import { makeTenantOnboardingFacade } from "../core/ports/tenantOnboarding.facade";

describe("tenant onboarding port", () => {
  it("rejects invalid tenant keys", async () => {
    const p = makeTenantOnboardingFacade();
    const r = await p.onboardTenant({ tenantKey: "!!", actorId: "a1", nowUtc: "2026-02-03T00:00:00Z" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("ERR_TENANT_KEY_INVALID");
  });

  it("creates tenant deterministically and blocks duplicates", async () => {
    const p = makeTenantOnboardingFacade();
    const a = await p.onboardTenant({ tenantKey: "acme", actorId: "a1", nowUtc: "2026-02-03T00:00:00Z" });
    expect(a.ok).toBe(true);
    if (a.ok) {
      expect(a.tenant.tenantId).toBe("t_acme");
      expect(a.tenant.tenantKey).toBe("acme");
    }
    const b = await p.onboardTenant({ tenantKey: "acme", actorId: "a1", nowUtc: "2026-02-03T00:00:01Z" });
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.reason).toBe("ERR_TENANT_ALREADY_EXISTS");
  });
});
