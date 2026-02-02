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

// __PHASE5_APP_LOCAL_CONTRACTS_V1__
// APP-local contracts are public for app-level adapter implementations.
export type { VfsPort, VfsRead, VfsWrite, VfsDelete, VfsResult } from "../contracts/vfsPort.contract";
export type { SnapshotPort, SnapshotCreate, SnapshotRestore, SnapshotList, SnapshotMeta, SnapshotResult } from "../contracts/snapshotPort.contract";
