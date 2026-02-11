import { describe, it, expect, vi } from "vitest";
import { hydrateTenantOverrides } from "../platform/tenantOverrides/hydrate";
import { getTenantOverridesCache } from "../platform/tenantOverrides/cache";
import * as store from "../platform/tenantOverrides/store";

describe("tenant overrides hydrate (contract)", () => {
  it("fail-soft keeps defaults when read fails", async () => {
    const spy = vi.spyOn(store, "readTenantOverrides").mockRejectedValue(new Error("read failed"));
    const before = getTenantOverridesCache("tenant_missing___");
    const res = await hydrateTenantOverrides({ tenantId: "tenant_missing___" });
    expect(res.ok).toBe(false);
    const after = getTenantOverridesCache("tenant_missing___");
    expect(after).toBe(before);
    spy.mockRestore();
  });
});
