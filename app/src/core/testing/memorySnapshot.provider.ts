import type {
  SnapshotPort,
  SnapshotCreate,
  SnapshotRestore,
  SnapshotList,
  SnapshotMeta,
  SnapshotResult
} from "../contracts/snapshotPort.contract";
import type { VfsPort } from "../contracts/vfsPort.contract";

type SnapshotBlob = { meta: SnapshotMeta; dump: Record<string, unknown> };

function nowIso(): string {
  return new Date().toISOString();
}

export function createMemorySnapshot(vfs: VfsPort): SnapshotPort {
  const byTenantNs = new Map<string, SnapshotBlob[]>();

  function key(t: string, ns: string): string {
    return `${t}::${ns}`;
  }

  function dumpNamespace(t: string, ns: string): Record<string, unknown> {
    // @ts-expect-error test-only hook from memory VFS
    const store: Map<string, unknown> | undefined = (vfs as any)?.__store;
    const out: Record<string, unknown> = {};
    if (!store) return out;
    const prefix = `${t}::${ns}::`;
    for (const [kk, vv] of store.entries()) {
      if (kk.startsWith(prefix)) out[kk] = vv;
    }
    return out;
  }

  function applyDump(dump: Record<string, unknown>): void {
    // @ts-expect-error test-only hook from memory VFS
    const store: Map<string, unknown> | undefined = (vfs as any)?.__store;
    if (!store) return;
    for (const [kk, vv] of Object.entries(dump)) store.set(kk, vv);
  }

  return {
    async create(cmd: SnapshotCreate): Promise<SnapshotResult<string>> {
      const snapId = `snap_${cmd.tenantId}_${cmd.namespace}_${Date.now()}`;
      const meta: SnapshotMeta = { snapshotId: snapId, ts: nowIso(), reason: cmd.reason };
      const dump = dumpNamespace(cmd.tenantId, cmd.namespace);
      const k = key(cmd.tenantId, cmd.namespace);
      const arr = byTenantNs.get(k) || [];
      arr.unshift({ meta, dump });
      byTenantNs.set(k, arr);
      return { ok: true, value: snapId };
    },

    async restore(cmd: SnapshotRestore): Promise<SnapshotResult<true>> {
      const k = key(cmd.tenantId, cmd.namespace);
      const arr = byTenantNs.get(k) || [];
      const found = arr.find(s => s.meta.snapshotId === cmd.snapshotId);
      if (!found) return { ok: false, error: "ERR_SNAPSHOT_NOT_FOUND" };

      // Clear current keys for this namespace then restore dump.
      // @ts-expect-error test-only hook from memory VFS
      const store: Map<string, unknown> | undefined = (vfs as any)?.__store;
      if (store) {
        const prefix = `${cmd.tenantId}::${cmd.namespace}::`;
        for (const kk of Array.from(store.keys())) {
          if (kk.startsWith(prefix)) store.delete(kk);
        }
      }
      applyDump(found.dump);
      return { ok: true, value: true };
    },

    async list(cmd: SnapshotList): Promise<SnapshotResult<readonly SnapshotMeta[]>> {
      const k = key(cmd.tenantId, cmd.namespace);
      const arr = byTenantNs.get(k) || [];
      return { ok: true, value: arr.map(s => s.meta) };
    }
  };
}
