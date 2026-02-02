/**
 * CP Enforcement Wiring (boundary-safe)
 *
 * Hard rule: NO imports from core-kernel / platform-services / modules here.
 * This module provides dependency injection binders so CP can wire
 * ActivationRegistry + PolicyEngine implementations without cross-boundary imports.
 */

import type { ActivationRegistryFacade } from "./activationRegistry.facade";
import type { PolicyEngineFacade } from "./policyEngine.facade";

export type EnforcementDeps = Readonly<{
  activationRegistry: ActivationRegistryFacade;
  policyEngine: PolicyEngineFacade;
}>;

let _deps: EnforcementDeps | null = null;

/**
 * Register deps at runtime (CP bootstrap) — called from within app boundary only.
 */
export function registerCpEnforcementDeps(deps: EnforcementDeps): void {
  _deps = deps;
}

/**
 * Retrieve deps; throws if not registered.
 * Used by CP flows that require enforcement.
 */
export function requireCpEnforcementDeps(): EnforcementDeps {
  if (_deps) return _deps;

  // Optional escape hatch for environments where bootstrap uses a global registry.
  // Still boundary-safe because it does not import anything.
  const g: any = globalThis as any;
  const fromGlobal = g?.__ICONTROL_CP_ENFORCEMENT_DEPS__;
  if (fromGlobal && fromGlobal.activationRegistry && fromGlobal.policyEngine) {
    _deps = fromGlobal as EnforcementDeps;
    return _deps;
  }

  throw new Error("ERR_CP_ENFORCEMENT_DEPS_NOT_REGISTERED");
}

/**
 * Convenience binders (kept for compatibility with earlier test naming).
 */
export function bindActivationRegistry(): ActivationRegistryFacade {
  return requireCpEnforcementDeps().activationRegistry;
}

export function bindPolicyEngine(): PolicyEngineFacade {
  return requireCpEnforcementDeps().policyEngine;
}

/**
 * Reset helper for tests only (not exported via public runtime barrel).
 */
export function __resetForTests(): void {
  _deps = null;
}
