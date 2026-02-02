import type { VfsPort, VfsRead, VfsWrite, VfsDelete, VfsResult } from "../contracts/vfsPort.contract";

type Store = Map<string, unknown>;

function k(tenantId: string, ns: string, key: string): string {
  return `${tenantId}::${ns}::${key}`;
}

export function createMemoryVfs(): VfsPort {
  const store: Store = new Map();

  const port: any = {
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
    }
  };

  // test-only hook used by memorySnapshot.provider.ts
  port.__store = store;

  return port as VfsPort;
}
