import { describe, it, expect } from "vitest";
import { makeBillingHookFacade } from "../core/ports/billingHook.facade";

describe("billing hook stub", () => {
  it("bindBilling returns free plan without external provider", async () => {
    const b = makeBillingHookFacade();
    const res = await b.bindBillingForTenant({
      tenant: { tenantId: "t_acme", tenantKey: "acme", createdAtUtc: "2026-02-03T00:00:00Z", source: "onboarding" },
      entitlements: { tenantKey: "acme", granted: ["core.access"], source: "default-baseline" },
      nowUtc: "2026-02-03T00:00:01Z",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.plan).toBe("free");
      expect(res.note).toContain("billing-stub");
    }
  });
});
