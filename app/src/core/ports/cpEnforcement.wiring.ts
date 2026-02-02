/**
 * CP Enforcement Wiring (boundary-safe)
 * Binds existing CP activation + policy implementations already within app boundary.
 * No core-kernel imports here.
 */
import type { ActivationRegistryFacade } from "./activationRegistry.facade";
import type { PolicyEngineFacade } from "./policyEngine.facade";

// These imports MUST remain within app boundary; update targets if discovery points differ.
import * as CP_ACT from "../..//core-kernel/src/policy/_tests_/policyEngine.contract.test.ts";
import * as POL from "../..//core-kernel/src/policy/types.ts";

export function bindActivationRegistry(): ActivationRegistryFacade {
  // Heuristic: existing module exports should contain isEnabled/setEnabled/listEnabled or similar.
  // If names differ, adjust in a follow-up patch with exact export names.
  const isEnabled = (CP_ACT as any).isEnabled || (CP_ACT as any).activationIsEnabled;
  const setEnabled = (CP_ACT as any).setEnabled || (CP_ACT as any).activationSetEnabled;
  const listEnabled = (CP_ACT as any).listEnabled || (CP_ACT as any).activationListEnabled;

  if (!isEnabled || !setEnabled || !listEnabled) {
    throw new Error("ERR_BIND_ACTIVATION_EXPORTS_MISSING");
  }
  return { isEnabled, setEnabled, listEnabled };
}

export function bindPolicyEngine(): PolicyEngineFacade {
  const evaluate = (POL as any).evaluate || (POL as any).policyEvaluate;
  if (!evaluate) throw new Error("ERR_BIND_POLICY_EXPORTS_MISSING");
  return { evaluate };
}
