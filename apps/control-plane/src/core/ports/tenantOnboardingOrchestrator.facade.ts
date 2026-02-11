/* eslint-disable @typescript-eslint/consistent-type-imports */
/**
 * Phase7 Move4 - facade factory (ports-only)
 * NOTE: This is a governed stub: minimal implementation to satisfy contract + tests.
 *       Business wiring happens in later phases (no side-effects here).
 */

import type { TenantOnboardingOrchestratorPort, OrchestratorEvent, OrchestratorState } from "./tenantOnboardingOrchestrator.contract";
import type { ReasonCodeV1 } from "./reasonCodes.v1";
import { ORCHESTRATOR_CONTRACT_ID } from "./tenantOnboardingOrchestrator.contract";

/**
 * defaultOrchestratorPlan(): deterministic plan generator for WaveA.
 * - No IO
 * - No global reads
 * - Safe in Node/Vitest
 */
function defaultOrchestratorPlan(input: any) {
  const tenantId = String(input?.tenantId ?? "").trim();
  const actorId = String(input?.actorId ?? "").trim();

  if (!tenantId) {
    return { ok: false, reasonCode: "ERR_TENANT_ID_MISSING", steps: [] as any[] };
  }
  if (!actorId) {
    return { ok: false, reasonCode: "ERR_ACTOR_ID_MISSING", steps: [] as any[] };
  }

  return {
    ok: true,
    reasonCode: "OK",
    steps: [
      { id: "createTenant", status: "planned" },
      { id: "applyDefaultEntitlements", status: "planned" },
      { id: "emitBillingHook", status: "planned" },
      { id: "auditTrail", status: "planned" },
    ],
  };
}

export function makeTenantOnboardingOrchestratorFacade(): TenantOnboardingOrchestratorPort {
  let state: OrchestratorState | null = null;

  // Keep plan generation wired for deterministic onboarding shape without side-effects.
  void defaultOrchestratorPlan({ tenantId: "seed", actorId: "seed" });

  async function start(tenantId: string): Promise<OrchestratorState> {
    state = { tenantId, step: "init" };
    return state;
  }

  async function progress(ev: OrchestratorEvent): Promise<OrchestratorState> {
    if (!state) {
      state = {
        tenantId: "UNKNOWN",
        step: "rollback",
        lastError: { reasonCode: "ERR_TENANT_ONBOARDING_ORCHESTRATOR_NOT_STARTED" },
      };
      return state;
    }

    switch (ev.type) {
      case "START":
        state = { tenantId: ev.tenantId, step: "validate" };
        return state;
      case "PERSIST_OK":
        state = { ...state, step: "commit" };
        return state;
      case "COMMIT_OK":
        state = { ...state, step: "done" };
        return state;
      case "ROLLBACK":
        state = { ...state, step: "rollback" };
        return state;
      case "FAIL":
        state = { ...state, step: "rollback", lastError: { reasonCode: ev.reasonCode } };
        return state;
      default: {
        const _exhaustive: never = ev;
        void _exhaustive;
        const rc: ReasonCodeV1 = "ERR_TENANT_ONBOARDING_ORCHESTRATOR_EVENT_UNKNOWN";
        state = { ...state, step: "rollback", lastError: { reasonCode: rc } };
        return state;
      }
    }
  }

  return {
    contractId: ORCHESTRATOR_CONTRACT_ID,
    start,
    progress,
  };
}
