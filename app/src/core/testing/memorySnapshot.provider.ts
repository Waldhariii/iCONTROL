import type {
  SnapshotPort,
  SnapshotCreate,
  SnapshotRestore,
  SnapshotList,
  SnapshotMeta,
  SnapshotResult
} from "../../../../core-kernel/src/contracts/snapshotPort.contract";
import type { VfsPort } from "../../../../core-kernel/src/contracts/vfsPort.contract";

type SnapshotBlob = {
  meta: SnapshotMeta;
  dump: Record<string, unknown>;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function createMemorySnapshot(vfs: VfsPort): SnapshotPort {
  const byTenantNs = new Map<string, SnapshotBlob[]>();

  function key(t: string, ns: string): string {
    return `${t}::${ns}`;
  }

  function dumpNamespace(t: string, ns: string): Record<string, unknown> {
    // @ts-expect-error test-only hook from memory provider
    const store: Map<string, unknown> | undefined = vfs?.__store;
    const out: Record<string, unknown> = {};
    if (!store) return out;
    const prefix = `${t}::${ns}::`;
    for (const [k, v] of store.entries()) {
      if (k.startsWith(prefix)) out[k] = v;
    }
    return out;
  }

  function restoreDump(dump: Record<string, unknown>): void {
    // @ts-expect-error test-only hook from memory provider
    const store: Map<string, unknown> | undefined = vfs?.__store;
    if (!store) return;
    for (const [k, v] of Object.entries(dump)) {
      store.set(k, v);
    }
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

      // Clear current namespace keys then restore dump
      // @ts-expect-error test-only hook
      const store: Map<string, unknown> | undefined = vfs?.__store;
      if (store) {
        const prefix = `${cmd.tenantId}::${cmd.namespace}::`;
        for (const kk of Array.from(store.keys())) {
          if (kk.startsWith(prefix)) store.delete(kk);
        }
      }
      restoreDump(found.dump);
      return { ok: true, value: true };
    },

    async list(cmd: SnapshotList): Promise<SnapshotResult<readonly SnapshotMeta[]>> {
      const k = key(cmd.tenantId, cmd.namespace);
      const arr = byTenantNs.get(k) || [];
      return { ok: true, value: arr.map(s => s.meta) };
    }
  };
}
