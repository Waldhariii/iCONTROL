// ========================================
// SSOT Ports Index — public surface (frozen)
// Keep exports aligned with ports-public-surface.freeze.contract.test.ts
// ========================================

// Values (functions/objects)
export { createPolicyEngineFacade } from "./policyEngine.facade";
export { createActivationRegistryFacade } from "./activationRegistry.facade";
export { makeBillingSinkFacade } from "./billingSink.facade";
export { makeTenantOnboardingOrchestratorFacade } from "./tenantOnboardingOrchestrator.facade";
export { makeTenantOnboardingPersistedFacade } from "./tenantOnboarding.persisted.facade";
export { REASON_CODES_V1 } from "./reasonCodes.v1";
export { BILLING_SINK_CONTRACT_ID } from "./billingSink.contract";
export { ORCHESTRATOR_CONTRACT_ID } from "./tenantOnboardingOrchestrator.contract";
export { TENANT_ONBOARDING_PERSIST_CONTRACT_ID } from "./tenantOnboardingPersist.contract";

// Bootstrap / wiring
export { bootstrapCpEnforcement } from "./cpEnforcement.bootstrap";
export {
  __resetForTests,
  bindActivationRegistry,
  bindPolicyEngine,
  registerCpEnforcementDeps,
  requireCpEnforcementDeps,
} from "./cpEnforcement.wiring";

// Bindings
export { bindSnapshot } from "./snapshot.bind";
export { bindSnapshotPort, getSnapshotPort } from "./snapshot.facade";
export { bindVfs } from "./vfs.bind";
export { bindVfsPort, getVfsPort } from "./vfs.facade";

// Types ONLY
export type {
  Action,
  PolicyDecision,
  PolicyEngineFacade,
  Resource,
  Subject,
  TenantId,
  PolicyContext,
} from "./policyEngine.facade";

export type {
  ActivationDecision,
  ActivationRegistryFacade,
  ActivationWrite,
  ModuleId,
} from "./activationRegistry.facade";

export type { ReasonCode, ReasonCodeV1 } from "./reasonCodes.v1";
export type { EnforcementDeps } from "./cpEnforcement.wiring";
export type { ActorId, RuntimeIdentity, RuntimeIdentityPort } from "./runtimeIdentity.contract";
