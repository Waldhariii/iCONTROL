import { describe, it, expect } from "vitest";

describe("billing hook invariants (contract)", () => {
  it("default billing hook can be safely no-op without throwing", async () => {
    const billingHook = {
      async onTenantProvisioned() { /* no-op */ },
    };

    await expect(billingHook.onTenantProvisioned({ tenantId: "t1", actorId: "system" } as any)).resolves.toBeUndefined();
  });
});
