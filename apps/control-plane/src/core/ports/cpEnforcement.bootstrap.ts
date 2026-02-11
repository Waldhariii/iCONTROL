/**
 * CP Enforcement Bootstrap (boundary-safe)
 *
 * Goal: register enforcement deps during CP startup without cross-boundary imports.
 * This stays in app boundary and only imports local facades + wiring.
 */
import { registerCpEnforcementDeps } from "./index";
import { createActivationRegistryFacade } from "./index";
import { createPolicyEngineFacade } from "./index";

/**
 * Called by CP entrypoint when appKind === "CP".
 */
export function bootstrapCpEnforcement(): void {
  // Facades are boundary-safe; they may internally use adapters already allowed in app boundary.
  const activationRegistry = createActivationRegistryFacade();
  const policyEngine = createPolicyEngineFacade();

  registerCpEnforcementDeps({ activationRegistry, policyEngine });
}
