import type { SnapshotPort } from "../../../../core-kernel/src/contracts/snapshotPort.contract";
import { bindSnapshotPort } from "./snapshot.facade";

export type SnapshotFactory = () => SnapshotPort;

/** Boundary-safe binder: adapters provide concrete impl via factory. */
export function bindSnapshot(factory: SnapshotFactory): void {
  bindSnapshotPort(factory());
}
