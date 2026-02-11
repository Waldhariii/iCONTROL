import { describe, it, expect, vi } from "vitest";
import { hydrateTenantRuntime } from "../platform/bootstrap/hydrateTenantRuntime";

const calls: string[] = [];

vi.mock("../platform/tenantOverrides/safeMode", () => ({
  hydrateTenantOverridesSafeMode: async () => {
    calls.push("safeMode");
    return { ok: true, enabled: false };
  },
}));

vi.mock("../platform/tenantOverrides/hydrate", () => ({
  hydrateTenantOverrides: async () => {
    calls.push("overrides");
    return { ok: true };
  },
}));

describe("tenant runtime hydration order (contract)", () => {
  it("hydrates safe-mode before overrides", async () => {
    calls.length = 0;
    await hydrateTenantRuntime({ tenantId: "t1", appKind: "APP", isProd: false, source: "default" });
    expect(calls).toEqual(["safeMode", "overrides"]);
  });
});
