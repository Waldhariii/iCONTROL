import { describe, it, expect } from "vitest";
import { makeTenantOnboardingOrchestratorFacade } from "../core/ports/tenantOnboardingOrchestrator.facade";

describe("tenantOnboarding orchestrator (contract e2e)", () => {
  it("runs deterministic happy-path with stub deps", async () => {
    const orch = makeTenantOnboardingOrchestratorFacade();

    const s0 = await orch.start("t1");
    expect(s0.tenantId).toBe("t1");
    expect(s0.step).toBe("init");

    const s1 = await orch.progress({ type: "START", tenantId: "t1" });
    expect(s1.step).toBe("validate");

    const s2 = await orch.progress({ type: "PERSIST_OK" });
    expect(s2.step).toBe("commit");

    const s3 = await orch.progress({ type: "COMMIT_OK" });
    expect(s3.step).toBe("done");
  });

  it("fails in rollback state when called before start", async () => {
    const orch = makeTenantOnboardingOrchestratorFacade();
    const s = await orch.progress({ type: "PERSIST_OK" });
    expect(s.step).toBe("rollback");
    expect(s.lastError?.reasonCode).toBe("ERR_TENANT_ONBOARDING_ORCHESTRATOR_NOT_STARTED");
  });
});
