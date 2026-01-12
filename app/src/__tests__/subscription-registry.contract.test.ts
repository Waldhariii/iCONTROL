import { describe, it, expect } from "vitest";
import { adminSetActivePlan, adminCancel } from "../core/subscription/registryApi";
import { getEntitlementsForTenant } from "../core/subscription/entitlementsApi";

describe("subscription registry (internal SSOT) -> entitlements read-model", () => {
  it("setActivePlan changes effective plan", async () => {
    await adminSetActivePlan({
      tenantId: "t_reg",
      planId: "enterprise_standard",
      startedAtIso: "2026-01-11T00:00:00.000Z",
      expiresAtIso: "2026-02-01T00:00:00.000Z",
    });

    const out = await getEntitlementsForTenant("t_reg", "2026-01-11T00:00:00.000Z");
    expect(out.effectivePlanId).toBe("enterprise_standard");
  });

  it("cancel falls back to enterprise_free (resolver behavior)", async () => {
    await adminCancel({
      tenantId: "t_reg",
      canceledAtIso: "2026-01-11T00:00:00.000Z",
    });

    const out = await getEntitlementsForTenant("t_reg", "2026-01-11T00:00:00.000Z");
    expect(out.effectivePlanId).toBe("enterprise_free");
  });
});
