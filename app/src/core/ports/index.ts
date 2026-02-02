/**
 * SSOT Ports Index (contract-first)
 * Rule: CP/APP import ports ONLY from this file.
 * Goal: prevent symbol drift and cross-file ad-hoc imports.
 */

// Facades (boundary-safe factories)
export * from "./activationRegistry.facade";
export * from "./policyEngine.facade";

// Bootstrap / wiring
export * from "./cpEnforcement.bootstrap";
export * from "./cpEnforcement.wiring";

export * from "./reasonCodes.v1";

// Runtime identity (SSOT)
export * from "./runtimeIdentity.contract";

// ---- VFS + Snapshot (Phase5)
export { bindVfsPort, getVfsPort } from "./vfs.facade";
export { bindSnapshotPort, getSnapshotPort } from "./snapshot.facade";
export { bindVfs } from "./vfs.bind";
export { bindSnapshot } from "./snapshot.bind";
