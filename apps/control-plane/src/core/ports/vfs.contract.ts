/**
 * VFS contract (narrow)
 * - Minimal operations for deterministic JSON persistence
 */
export type VfsPath = string;

export type VfsReadResult =
  | { ok: true; contentUtf8: string }
  | { ok: false; reason: "ERR_VFS_NOT_FOUND" | "ERR_VFS_NOT_BOUND" | "ERR_VFS_READ_FAILED" };

export type VfsWriteResult =
  | { ok: true }
  | { ok: false; reason: "ERR_VFS_NOT_BOUND" | "ERR_VFS_WRITE_FAILED" };

export interface VfsPort {
  readUtf8(path: VfsPath): Promise<VfsReadResult>;
  writeUtf8(path: VfsPath, contentUtf8: string): Promise<VfsWriteResult>;
}
