import { describe, it, expect } from "vitest";
import { InMemorySubscriptionStore } from "../../../modules/core-system/subscription/SubscriptionStore";
import { InMemoryAuditTrail } from "../../../modules/core-system/subscription/AuditTrail";
import { SubscriptionService } from "../../../modules/core-system/subscription/SubscriptionService";
import { syncFromProvider } from "../../../modules/core-system/subscription/ProviderSync";
import { DefaultProviderPort } from "../../../modules/core-system/subscription/DefaultProviderPort";

describe("subscription guards + provider sync contract", () => {
  it("canUse/require work and default to enterprise_free entitlements", async () => {
    const store = new InMemorySubscriptionStore();
    const audit = new InMemoryAuditTrail();
    const svc = new SubscriptionService({ store, audit });

    const d = await svc.canUse("t1", "externalSync", "2026-01-11T00:00:00.000Z");
    expect(d.allowed).toBe(false);

    // require should throw for externalSync in free
    await expect(svc.require("t1", "externalSync", "2026-01-11T00:00:00.000Z")).rejects.toBeTruthy();

    const events = audit.snapshot().filter(e => e.type === "subscription_resolved");
    expect(events.length).toBeGreaterThan(0);
  });

  it("syncFromProvider never breaks: unknown plan maps to enterprise_free safely", async () => {
    const store = new InMemorySubscriptionStore();
    const audit = new InMemoryAuditTrail();
    const port = new DefaultProviderPort(); // default map => null => free
    await syncFromProvider({ store, audit, port }, {
      tenantId: "t1",
      provider: "stripe",
      planExternalId: "price_unknown",
      status: "active",
      currentPeriodEndIso: "2026-02-01T00:00:00.000Z",
    });

    // Entitlements still resolve deterministically
    const svc = new SubscriptionService({ store, audit });
    const out = await svc.resolve("t1", "2026-01-11T00:00:00.000Z");
    expect(out.effectivePlanId).toBe("enterprise_free");
  });
});
