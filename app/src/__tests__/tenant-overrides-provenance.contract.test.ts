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

import { cpWriteTenantOverrides } from "../platform/controlPlane/commands/writeTenantOverrides";
import { cpTenantRuntimeSnapshot } from "../platform/controlPlane/diagnostics/tenantRuntimeSnapshot";
import { getTenantOverridesProvenance, clearTenantOverridesProvenance } from "../platform/tenantOverrides/provenance";

describe("tenant overrides provenance (contract)", () => {
  it("CP write records provenance and snapshot returns it", async () => {
    const tenantId = "t_prov";
    clearTenantOverridesProvenance(tenantId);

    await cpWriteTenantOverrides({
      tenantId,
      actorId: "admin1",
      overrides: {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        features: { automation: true },
      },
    });

    const prov = getTenantOverridesProvenance(tenantId);
    expect(prov?.decision).toBe("APPLIED");
    expect(prov?.overrides?.attempted).toBe(true);

    const snap = await cpTenantRuntimeSnapshot(tenantId);
    expect(snap.provenance?.decision).toBe("APPLIED");
  });
});
