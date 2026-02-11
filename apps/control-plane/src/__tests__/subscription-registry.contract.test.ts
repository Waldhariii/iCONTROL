import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminSetActivePlan,
  adminCancel,
} from "../core/subscription/registryApi";
import { getEntitlementsForTenant } from "../core/subscription/entitlementsApi";
import { InMemorySubscriptionStore } from "@modules/core-system/subscription/SubscriptionStore";
import { InMemoryAuditTrail } from "@modules/core-system/subscription/AuditTrail";
import { SubscriptionService as SubscriptionServiceImpl } from "@modules/core-system/subscription/SubscriptionService";

let store = new InMemorySubscriptionStore();

vi.mock("../core/subscription/subscriptionServiceFactory", () => ({
  getSubscriptionStore: async () => store,
  getSubscriptionService: async () =>
    new SubscriptionServiceImpl({
      store,
      audit: new InMemoryAuditTrail(),
    }),
}));

beforeEach(() => {
  store = new InMemorySubscriptionStore();
});

describe("subscription registry (internal SSOT) -> entitlements read-model", () => {
  it("setActivePlan changes effective plan", async () => {
    await adminSetActivePlan({
      tenantId: "t_reg",
      planId: "enterprise_standard",
      startedAtIso: "2026-01-11T00:00:00.000Z",
      expiresAtIso: "2026-02-01T00:00:00.000Z",
    });

    const out = await getEntitlementsForTenant(
      "t_reg",
      "2026-01-11T00:00:00.000Z",
    );
    expect(out.effectivePlanId).toBe("enterprise_standard");
  });

  it("cancel falls back to enterprise_free (resolver behavior)", async () => {
    await adminCancel({
      tenantId: "t_reg",
      canceledAtIso: "2026-01-11T00:00:00.000Z",
    });

    const out = await getEntitlementsForTenant(
      "t_reg",
      "2026-01-11T00:00:00.000Z",
    );
    expect(out.effectivePlanId).toBe("enterprise_free");
  });
});
