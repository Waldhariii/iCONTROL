import type { VfsPort, VfsReadResult, VfsWriteResult } from "../ports/vfs.contract";

export function makeMemoryVfsProvider(seed?: Record<string, string>): VfsPort {
  const db = new Map<string, string>(Object.entries(seed || {}));
  return {
    async readUtf8(path: string): Promise<VfsReadResult> {
      if (!db.has(path)) return { ok: false, reason: "ERR_VFS_NOT_FOUND" };
      return { ok: true, contentUtf8: db.get(path) || "" };
    },
    async writeUtf8(path: string, contentUtf8: string): Promise<VfsWriteResult> {
      db.set(path, contentUtf8);
      return { ok: true };
    },
  };
}
