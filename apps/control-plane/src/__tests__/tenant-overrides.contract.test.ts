import { describe, it, expect } from "vitest";
import { setTenantOverridesCache, getTenantOverridesCache } from "../platform/tenantOverrides/cache";
import { resolveTheme } from "../platform/theme/resolveTheme";
import { entitlementsContextFromRuntimeConfig } from "../platform/entitlements/fromRuntimeConfig";

describe("tenant overrides (contract)", () => {
  it("cache applies theme overrides", () => {
    setTenantOverridesCache("t1", {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      theme: { CP: { accent: "var(--ic-accent-cp-tenant)" } } as any,
    });

    const t = resolveTheme({ tenantId: "t1", appKind: "APP", mode: "dark" });
    expect(t.tokens.accent).toBe("var(--ic-accent-cp-tenant)");
    expect(t.meta.appliedOverrides).toBe(true);
  });

  it("cache merges feature flags into entitlements context", () => {
    setTenantOverridesCache("t1", {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      features: { automation: true },
    });

    const ctx = entitlementsContextFromRuntimeConfig({ tenantId: "t1", role: "user" });
    expect(ctx.features?.automation).toBe(true);
  });

  it("cache getter works", () => {
    expect(getTenantOverridesCache("t1")).toBeTruthy();
  });
});
