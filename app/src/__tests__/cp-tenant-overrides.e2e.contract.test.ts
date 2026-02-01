import { describe, it, expect, vi } from "vitest";
import { cpWriteTenantOverrides } from "../platform/controlPlane/commands/writeTenantOverrides";
import { resolveTheme } from "../platform/theme/resolveTheme";
import { entitlementsContextFromRuntimeConfig } from "../platform/entitlements/fromRuntimeConfig";

// Mock VFS read/write to keep the contract deterministic (no real storage needed)
let mem: Record<string, string> = {};

vi.mock("../platform/vfs", () => ({
  vfsWriteText: async (p: string, s: string) => { mem[p] = s; },
  vfsReadText: async (p: string) => {
    if (!(p in mem)) throw new Error("not found");
    return mem[p];
  },
}));

// Mock writeGateway to execute closure (contract: single write entry)
vi.mock("../platform/writeGateway", () => ({
  writeGateway: async (fn: any) => fn(),
}));

describe("CP tenant overrides (e2e contract)", () => {
  it("writes overrides, hydrates, and applies to theme + entitlements", async () => {
    const tenantId = "t1";
    await cpWriteTenantOverrides({
      tenantId,
      actorId: "admin1",
      overrides: {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        theme: { CP: { accent: "var(--ic-accent-cp-tenant)" } } as any,
        features: { automation: true },
      },
    });

    const theme = resolveTheme({ tenantId, appKind: "APP", mode: "dark" });
    expect(theme.tokens.accent).toBe("var(--ic-accent-cp-tenant)");

    const ctx = entitlementsContextFromRuntimeConfig({ tenantId, role: "user" });
    expect(ctx.features?.automation).toBe(true);
  });
});
