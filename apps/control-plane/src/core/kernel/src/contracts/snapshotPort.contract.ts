/**
 * Snapshot/Rollback Port — Contract (v1)
 * Snapshots are namespace-scoped and tenant-scoped. All operations must be governed/audited upstream.
 */
export type TenantId = string;
export type Namespace = string;

export type SnapshotId = string;

export type SnapshotCreate = Readonly<{
  tenantId: TenantId;
  namespace: Namespace;
  reason: string;        // business reason code / operator note
  correlationId: string;
}>;

export type SnapshotRestore = Readonly<{
  tenantId: TenantId;
  namespace: Namespace;
  snapshotId: SnapshotId;
  correlationId: string;
}>;

export type SnapshotList = Readonly<{
  tenantId: TenantId;
  namespace: Namespace;
}>;

export type SnapshotMeta = Readonly<{
  snapshotId: SnapshotId;
  ts: string;
  reason: string;
}>;

export type SnapshotResult<T> = Readonly<
  | { ok: true; value: T }
  | { ok: false; error: string }
>;

export interface SnapshotPort {
  create(cmd: SnapshotCreate): Promise<SnapshotResult<SnapshotId>>;
  restore(cmd: SnapshotRestore): Promise<SnapshotResult<true>>;
  list(cmd: SnapshotList): Promise<SnapshotResult<readonly SnapshotMeta[]>>;
}
