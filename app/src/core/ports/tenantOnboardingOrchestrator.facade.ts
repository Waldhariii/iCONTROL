/* eslint-disable @typescript-eslint/consistent-type-imports */
/**
 * Phase7 Move4 - facade factory (ports-only)
 * NOTE: This is a governed stub: minimal implementation to satisfy contract + tests.
 *       Business wiring happens in later phases (no side-effects here).
 */

import type { TenantOnboardingOrchestratorPort, OrchestratorEvent, OrchestratorState } from "./tenantOnboardingOrchestrator.contract";
import type { ReasonCodeV1 } from "./reasonCodes.v1";
import { ORCHESTRATOR_CONTRACT_ID } from "./tenantOnboardingOrchestrator.contract";

export function makeTenantOnboardingOrchestratorFacade(): TenantOnboardingOrchestratorPort {
  let state: OrchestratorState | null = null;

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
