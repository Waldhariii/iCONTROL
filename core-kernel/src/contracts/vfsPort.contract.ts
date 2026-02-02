/**
 * VFS Port — Contract (v1)
 * Business goal: multi-tenant storage via namespaces, no raw fs/path access in app/cp.
 */
export type TenantId = string;
export type Namespace = string; // e.g. "tenant/<id>/overrides", "tenant/<id>/snapshots"
export type Key = string;       // key within namespace, NOT a path

export type VfsRead = Readonly<{
  tenantId: TenantId;
  namespace: Namespace;
  key: Key;
}>;

export type VfsWrite = Readonly<{
  tenantId: TenantId;
  namespace: Namespace;
  key: Key;
  valueJson: unknown;
  correlationId: string;
}>;

export type VfsDelete = Readonly<{
  tenantId: TenantId;
  namespace: Namespace;
  key: Key;
  correlationId: string;
}>;

export type VfsResult<T> = Readonly<
  | { ok: true; value: T }
  | { ok: false; error: string }
>;

export interface VfsPort {
  read(cmd: VfsRead): Promise<VfsResult<unknown>>;
  write(cmd: VfsWrite): Promise<VfsResult<true>>;
  del(cmd: VfsDelete): Promise<VfsResult<true>>;
}
