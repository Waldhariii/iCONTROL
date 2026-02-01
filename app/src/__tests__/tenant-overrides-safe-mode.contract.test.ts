import { describe, it, expect } from "vitest";
import { setTenantOverridesCache, getTenantOverridesCache } from "../platform/tenantOverrides/cache";
import { enableTenantOverridesSafeMode, clearTenantOverridesSafeMode, isTenantOverridesSafeMode } from "../platform/tenantOverrides/safeMode";
import { resolveTheme } from "../platform/theme/resolveTheme";

describe("tenant overrides SAFE_MODE (contract)", () => {
  it("when SAFE_MODE enabled, cache is ignored and defaults apply", () => {
    const tenantId = "t_safe";
    clearTenantOverridesSafeMode(tenantId);

    setTenantOverridesCache(tenantId, {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      theme: { CP: { accent: "var(--ic-accent-cp-tenant)" } } as any,
      features: { automation: true },
    });

    // sanity: cached override would apply without safe mode
    const before = resolveTheme({ tenantId, appKind: "APP", mode: "dark" });
    expect(before.tokens.accent).toBe("var(--ic-accent-cp-tenant)");

    enableTenantOverridesSafeMode(tenantId, "test");
    expect(isTenantOverridesSafeMode(tenantId)).toBe(true);

    const cached = getTenantOverridesCache(tenantId);
    expect(cached).toBeUndefined();

    const after = resolveTheme({ tenantId, appKind: "APP", mode: "dark" });
    // should NOT use tenant override now (defaults are css vars; not the override string)
    expect(after.tokens.accent).not.toBe("var(--ic-accent-cp-tenant)");

    clearTenantOverridesSafeMode(tenantId);
    expect(isTenantOverridesSafeMode(tenantId)).toBe(false);
  });
});
