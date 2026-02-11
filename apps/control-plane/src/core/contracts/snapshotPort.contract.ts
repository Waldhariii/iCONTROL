/**
 * APP-local Snapshot/Rollback Port — Contract (v1)
 * NOTE: duplicated from core-kernel contract to avoid cross-boundary imports.
 */
export type TenantId = string;
export type Namespace = string;
export type SnapshotId = string;

export type SnapshotCreate = Readonly<{
  tenantId: TenantId;
  namespace: Namespace;
  reason: string;
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
