import { describe, it, expect } from "vitest";
import { makeTenantOnboardingOrchestratorFacade } from "../core/ports/tenantOnboarding.orchestrator.facade";

describe("tenantOnboarding orchestrator (contract e2e)", () => {
  it("runs deterministic happy-path with stub deps (dryRun=false but safe stubs)", async () => {
    const calls: string[] = [];

    const orch = makeTenantOnboardingOrchestratorFacade({
      tenantOnboarding: {
        async ensureTenant({ tenantId }) { calls.push("ensure:" + tenantId); },
      } as any,
      defaultEntitlements: {
        async applyDefaults({ tenantId }) { calls.push("ent:" + tenantId); },
      } as any,
      billingHook: {
        async onTenantProvisioned({ tenantId }) { calls.push("bill:" + tenantId); },
      } as any,
      snapshot: {
        async begin({ tenantId }) { calls.push("snap:begin:" + tenantId); return "snap1"; },
        async commit({ snapshotId }) { calls.push("snap:commit:" + snapshotId); },
        async rollback({ snapshotId }) { calls.push("snap:rollback:" + snapshotId); },
      } as any,
    });

    const res = await orch.run({ tenantId: "t1", actorId: "system" });
    expect(res.ok).toBe(true);
    expect(calls).toEqual([
      "snap:begin:t1",
      "ensure:t1",
      "ent:t1",
      "bill:t1",
      "snap:commit:snap1",
    ]);
  });

  it("fails fast on invalid input", async () => {
    const orch = makeTenantOnboardingOrchestratorFacade({
      tenantOnboarding: { async ensureTenant(){ throw new Error("should not"); } } as any,
      defaultEntitlements: { async applyDefaults(){ throw new Error("should not"); } } as any,
      billingHook: { async onTenantProvisioned(){ throw new Error("should not"); } } as any,
    });

    const res = await orch.run({ tenantId: "" as any });
    expect(res.ok).toBe(false);
    expect(res.reasonCode).toBe("ERR_TENANT_ONBOARDING_INVALID_INPUT");
  });
});
