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
import { cpTenantRuntimeSnapshot } from "../platform/controlPlane/diagnostics/tenantRuntimeSnapshot";

describe("CP SAFE_MODE enable/clear (contract)", () => {
  it("enable then clear toggles persisted + mem state", async () => {
    const tenantId = "t_sm";
    await cpEnableTenantOverridesSafeMode({ tenantId, actorId: "admin1", reason: "ops" });

    const s1 = await cpTenantRuntimeSnapshot(tenantId);
    expect(s1.safeMode.enabled).toBe(true);
    expect(s1.safeMode.persisted.enabled).toBe(true);

    await cpClearTenantOverridesSafeMode({ tenantId, actorId: "admin1", reason: "fixed" });

    const s2 = await cpTenantRuntimeSnapshot(tenantId);
    expect(s2.safeMode.enabled).toBe(false);
    expect(s2.safeMode.persisted.enabled).toBe(false);
  });
});
