import { describe, it, expect, vi } from "vitest";

let mem: Record<string, string> = {};

vi.mock("../platform/vfs", () => ({
  vfsWriteText: async (p: string, s: string) => { mem[p] = s; },
  vfsReadText: async (p: string) => {
    if (!(p in mem)) throw new Error("not found");
    return mem[p];
  },
}));

vi.mock("../platform/writeGateway", () => ({
  writeGateway: async (fn: any) => fn(),
}));

import { cpEnableTenantOverridesSafeMode } from "../platform/controlPlane/commands/enableTenantOverridesSafeMode";
import { cpClearTenantOverridesSafeMode } from "../platform/controlPlane/commands/clearTenantOverridesSafeMode";
import { setTenantOverridesCache } from "../platform/tenantOverrides/cache";
import { cpTenantRuntimeSnapshot } from "../platform/controlPlane/diagnostics/tenantRuntimeSnapshot";

describe("CP tenant runtime snapshot (contract)", () => {
  it("reports safe-mode + overrides applied state", async () => {
    const tenantId = "t_snap";
    await cpClearTenantOverridesSafeMode({ tenantId, actorId: "test" });

    setTenantOverridesCache(tenantId, {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      features: { automation: true },
    });

    const s1 = await cpTenantRuntimeSnapshot(tenantId);
    expect(s1.safeMode.enabled).toBe(false);
    expect(s1.overrides.presentInCache).toBe(true);
    expect(s1.overrides.applied).toBe(true);
    expect(typeof s1.overrides.hash).toBe("string");

    await cpEnableTenantOverridesSafeMode({ tenantId, actorId: "admin1", reason: "test" });

    const s2 = await cpTenantRuntimeSnapshot(tenantId);
    expect(s2.safeMode.enabled).toBe(true);
    expect(s2.overrides.presentInCache).toBe(false); // cache getter hides when safe-mode is on
    expect(s2.overrides.applied).toBe(false);
    expect(s2.safeMode.persisted.enabled).toBe(true);
  });
});
