import type { SnapshotPort } from "../../../../core-kernel/src/contracts/snapshotPort.contract";

let _snap: SnapshotPort | null = null;

export function bindSnapshotPort(port: SnapshotPort): void {
  _snap = port;
}

export function getSnapshotPort(): SnapshotPort {
  if (!_snap) throw new Error("ERR_SNAPSHOT_NOT_BOUND");
  return _snap;
}
