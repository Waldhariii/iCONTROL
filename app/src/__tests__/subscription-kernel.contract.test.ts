import { describe, it, expect } from "vitest";
import { resolveEntitlements } from "../../../modules/core-system/subscription/SubscriptionResolver";
import type { SubscriptionRecord } from "../../../modules/core-system/subscription/SubscriptionRecord";

describe("subscription kernel contract", () => {
  it("defaults to enterprise_free when subscription missing", () => {
    const out = resolveEntitlements({ tenantId: "t1", subscription: null, nowIso: "2026-01-11T00:00:00.000Z" });
    expect(out.effectivePlanId).toBe("enterprise_free");
    expect(out.reason).toBe("missing_fallback_free");
    expect(out.entitlements.unlimitedUsers).toBe(true);
    expect(out.entitlements.externalSync).toBe(false);
  });

  it("falls back to enterprise_free when subscription inactive", () => {
    const sub: SubscriptionRecord = {
      tenantId: "t1",
      planId: "enterprise_plus",
      status: "suspended",
      source: "internal",
      startedAt: "2026-01-01T00:00:00.000Z",
    };
    const out = resolveEntitlements({ tenantId: "t1", subscription: sub, nowIso: "2026-01-11T00:00:00.000Z" });
    expect(out.effectivePlanId).toBe("enterprise_free");
    expect(out.reason).toBe("inactive_fallback_free");
  });

  it("falls back to enterprise_free when subscription expired", () => {
    const sub: SubscriptionRecord = {
      tenantId: "t1",
      planId: "enterprise_standard",
      status: "active",
      source: "internal",
      startedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-10T00:00:00.000Z",
    };
    const out = resolveEntitlements({ tenantId: "t1", subscription: sub, nowIso: "2026-01-11T00:00:00.000Z" });
    expect(out.effectivePlanId).toBe("enterprise_free");
    expect(out.reason).toBe("expired_fallback_free");
  });

  it("uses entitlements for explicit active non-expired plan", () => {
    const sub: SubscriptionRecord = {
      tenantId: "t1",
      planId: "enterprise_standard",
      status: "active",
      source: "internal",
      startedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-02-01T00:00:00.000Z",
    };
    const out = resolveEntitlements({ tenantId: "t1", subscription: sub, nowIso: "2026-01-11T00:00:00.000Z" });
    expect(out.effectivePlanId).toBe("enterprise_standard");
    expect(out.reason).toBe("explicit");
    expect(out.entitlements.externalSync).toBe(true);
  });
});
