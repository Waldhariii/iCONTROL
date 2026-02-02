/**
 * SSOT Ports Index (contract-first)
 * Rule: CP/APP import ports ONLY from this file.
 * Goal: prevent symbol drift and cross-file ad-hoc imports.
 */

// Facades (boundary-safe factories)
export { ActivationDecision, ActivationRegistryFacade, ActivationWrite, createActivationRegistryFacade, ModuleId, TenantId } from "./activationRegistry.facade";
export { Action, createPolicyEngineFacade, PolicyContext, PolicyDecision, PolicyEngineFacade, Resource, Subject, TenantId } from "./policyEngine.facade";

// Bootstrap / wiring
export { bootstrapCpEnforcement } from "./cpEnforcement.bootstrap";
export { __resetForTests, bindActivationRegistry, bindPolicyEngine, EnforcementDeps, registerCpEnforcementDeps, requireCpEnforcementDeps } from "./cpEnforcement.wiring";

export { REASON_CODES_V1, ReasonCode, ReasonCodeV1 } from "./reasonCodes.v1";

// Runtime identity (SSOT)
export { ActorId, RuntimeIdentity, RuntimeIdentityPort, TenantId } from "./runtimeIdentity.contract";

// ---- VFS + Snapshot (Phase5)
export { bindVfsPort, getVfsPort } from "./vfs.facade";
export { bindSnapshotPort, getSnapshotPort } from "./snapshot.facade";
export { bindVfs } from "./vfs.bind";
export { bindSnapshot } from "./snapshot.bind";

// __PHASE5_APP_LOCAL_CONTRACTS_V1__
// APP-local contracts are public for app-level adapter implementations.
export type { VfsPort, VfsRead, VfsWrite, VfsDelete, VfsResult } from "../contracts/vfsPort.contract";
export type { SnapshotPort, SnapshotCreate, SnapshotRestore, SnapshotList, SnapshotMeta, SnapshotResult } from "../contracts/snapshotPort.contract";
