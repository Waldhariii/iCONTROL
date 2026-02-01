import { describe, it, expect, vi } from "vitest";

// Memory VFS to simulate persistence
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

import {
  enableTenantOverridesSafeMode,
  clearTenantOverridesSafeMode,
  hydrateTenantOverridesSafeMode,
  isTenantOverridesSafeMode,
} from "../platform/tenantOverrides/safeMode";

describe("tenant overrides SAFE_MODE persisted (contract)", () => {
  it("enable -> hydrate -> still enabled; clear -> hydrate -> disabled", async () => {
    const tenantId = "t_persist";

    await enableTenantOverridesSafeMode(tenantId, "test", "admin1");
    expect(isTenantOverridesSafeMode(tenantId)).toBe(true);

    // simulate restart: new hydrate should restore from VFS (latch may still be set, but hydrate should also succeed)
    const h1 = await hydrateTenantOverridesSafeMode({ tenantId });
    expect(h1.enabled).toBe(true);
    expect(isTenantOverridesSafeMode(tenantId)).toBe(true);

    await clearTenantOverridesSafeMode(tenantId, "admin1");
    expect(isTenantOverridesSafeMode(tenantId)).toBe(false);

    const h2 = await hydrateTenantOverridesSafeMode({ tenantId });
    expect(h2.enabled).toBe(false);
    expect(isTenantOverridesSafeMode(tenantId)).toBe(false);
  });
});
