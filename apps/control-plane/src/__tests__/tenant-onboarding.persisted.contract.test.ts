import { describe, it, expect } from "vitest";
import { makeMemoryVfsProvider } from "../core/testing/memoryVfs.provider";
import { makeMemorySnapshotProvider } from "../core/testing/memorySnapshot.provider";
import { makeTenantOnboardingPersistedFacade } from "../core/ports/tenantOnboarding.persisted.facade";

describe("tenant onboarding persisted facade", () => {
  it("creates tenant and persists to VFS layout", async () => {
    const vfs = makeMemoryVfsProvider();
    const snapshot = makeMemorySnapshotProvider();
    const p = makeTenantOnboardingPersistedFacade({ vfs, snapshot });

    const a = await p.onboardTenant({ tenantKey: "acme", actorId: "a1", nowUtc: "2026-02-03T00:00:00Z" });
    expect(a.ok).toBe(true);

    const r = await vfs.readUtf8("/ssot/tenants/acme/tenant.json");
    expect(r.ok).toBe(true);
    if (r.ok) {
      const parsed = JSON.parse(r.contentUtf8);
      expect(parsed.tenantId).toBe("t_acme");
      expect(parsed.tenantKey).toBe("acme");
    }

    const b = await p.onboardTenant({ tenantKey: "acme", actorId: "a1", nowUtc: "2026-02-03T00:00:01Z" });
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.reason).toBe("ERR_TENANT_ALREADY_EXISTS");
  });
});
