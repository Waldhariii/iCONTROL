/**
 * Snapshot contract (narrow)
 * - Allows atomic-like persistence semantics for tests and future providers
 */
export type SnapshotName = string;

export type SnapshotResult =
  | { ok: true; name: SnapshotName }
  | { ok: false; reason: "ERR_SNAPSHOT_NOT_BOUND" | "ERR_SNAPSHOT_FAILED" };

export interface SnapshotPort {
  createSnapshot(nameHint: string): Promise<SnapshotResult>;
}
