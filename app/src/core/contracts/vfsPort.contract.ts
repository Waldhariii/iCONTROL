/**
 * APP-local VFS Port — Contract (v1)
 * NOTE: duplicated from core-kernel contract to avoid cross-boundary imports.
 */
export type TenantId = string;
export type Namespace = string; // e.g. "tenant/<id>/overrides"
export type Key = string;       // logical key; NOT a filesystem path

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
