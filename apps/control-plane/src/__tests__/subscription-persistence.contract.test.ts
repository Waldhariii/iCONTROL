import { describe, it, expect } from "vitest";
import { FileSubscriptionStore } from "@modules/core-system/subscription/FileSubscriptionStore.node";
import type { SubscriptionRecord } from "@modules/core-system/subscription/SubscriptionRecord";
import { resolveEntitlements } from "@modules/core-system/subscription/SubscriptionResolver";

describe("subscription persistence + resolver fallback", () => {
  it("FileSubscriptionStore can upsert/get and resolver stays deterministic", async () => {
    const store = new FileSubscriptionStore({ baseDir: "_DATA/__test_subs" });
    const rec: SubscriptionRecord = {
      tenantId: "t_persist",
      planId: "enterprise_standard",
      status: "active",
      source: "internal",
      startedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-02-01T00:00:00.000Z",
    };

    await store.upsert(rec);
    const got = await store.getByTenantId("t_persist");
    expect(got?.planId).toBe("enterprise_standard");

    const out = resolveEntitlements({ tenantId: "t_persist", subscription: got!, nowIso: "2026-01-11T00:00:00.000Z" });
    expect(out.effectivePlanId).toBe("enterprise_standard");
  });

  it("corrupt JSON safely falls back to null subscription (=> enterprise_free)", async () => {
    const store = new FileSubscriptionStore({ baseDir: "_DATA/__test_subs_corrupt" });
    // create corrupt file
    const fs = await import("node:fs");
    const path = await import("node:path");
    const fp = path.join("_DATA/__test_subs_corrupt", "t_corrupt.json");
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, "{not-json");

    const got = await store.getByTenantId("t_corrupt");
    expect(got).toBe(null);

    const out = resolveEntitlements({ tenantId: "t_corrupt", subscription: null, nowIso: "2026-01-11T00:00:00.000Z" });
    expect(out.effectivePlanId).toBe("enterprise_free");
  });
});
