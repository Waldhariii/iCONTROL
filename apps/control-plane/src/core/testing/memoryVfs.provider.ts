import type { VfsPort as LegacyVfsPort, VfsRead, VfsWrite, VfsDelete, VfsResult } from "../contracts/vfsPort.contract";
import type { VfsPort as Utf8VfsPort, VfsReadResult, VfsWriteResult } from "../ports/vfs.contract";

type Store = Map<string, unknown>;

function k(tenantId: string, ns: string, key: string): string {
  return `${tenantId}::${ns}::${key}`;
}

type CombinedVfsPort = LegacyVfsPort & Utf8VfsPort & { __store: Store };

export function createMemoryVfs(): LegacyVfsPort {
  const store: Store = new Map();

  const port: CombinedVfsPort = {
    async read(cmd: VfsRead): Promise<VfsResult<unknown>> {
      const key = k(cmd.tenantId, cmd.namespace, cmd.key);
      if (!store.has(key)) return { ok: false, error: "ERR_VFS_NOT_FOUND" };
      return { ok: true, value: store.get(key) };
    },

    async write(cmd: VfsWrite): Promise<VfsResult<true>> {
      const key = k(cmd.tenantId, cmd.namespace, cmd.key);
      store.set(key, cmd.valueJson);
      return { ok: true, value: true };
    },

    async del(cmd: VfsDelete): Promise<VfsResult<true>> {
      const key = k(cmd.tenantId, cmd.namespace, cmd.key);
      store.delete(key);
      return { ok: true, value: true };
    },

    async readUtf8(path: string): Promise<VfsReadResult> {
      if (!store.has(path)) return { ok: false, reason: "ERR_VFS_NOT_FOUND" };
      const value = store.get(path);
      return { ok: true, contentUtf8: typeof value === "string" ? value : JSON.stringify(value) };
    },

    async writeUtf8(path: string, contentUtf8: string): Promise<VfsWriteResult> {
      store.set(path, contentUtf8);
      return { ok: true };
    },

    __store: store,
  };

  return port;
}

/**
 * Move2 narrow facade helper for UTF8-path persistence tests.
 */
export function makeMemoryVfsProvider(seed?: Record<string, string>): Utf8VfsPort {
  const vfs = createMemoryVfs() as CombinedVfsPort;
  for (const [path, value] of Object.entries(seed || {})) {
    vfs.__store.set(path, value);
  }
  return {
    readUtf8: vfs.readUtf8,
    writeUtf8: vfs.writeUtf8,
  };
}
