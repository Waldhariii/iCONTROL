import { describe, it, expect, vi } from "vitest";
import { hydrateTenantOverrides } from "../platform/tenantOverrides/hydrate";
import { getTenantOverridesCache } from "../platform/tenantOverrides/cache";

describe("tenant overrides hydrate (contract)", () => {
  it("fail-soft keeps defaults when read fails", async () => {
    // best-effort: ensure no tenant data exists by using an unlikely tenantId
    const before = getTenantOverridesCache("tenant_missing___");
    const res = await hydrateTenantOverrides({ tenantId: "tenant_missing___" });
    expect(res.ok).toBe(false);
    const after = getTenantOverridesCache("tenant_missing___");
    expect(after).toBe(before);
  });
});
