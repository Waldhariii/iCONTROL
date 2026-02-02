import type { SnapshotPort } from "../contracts/snapshotPort.contract";
import { bindSnapshotPort } from "./snapshot.facade";

export type SnapshotFactory = () => SnapshotPort;

/** Boundary-safe binder: adapters provide concrete impl via factory. */
export function bindSnapshot(factory: SnapshotFactory): void {
  bindSnapshotPort(factory());
}
