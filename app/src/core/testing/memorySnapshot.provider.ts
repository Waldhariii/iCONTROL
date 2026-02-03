import type {
  SnapshotPort as LegacySnapshotPort,
  SnapshotCreate,
  SnapshotRestore,
  SnapshotList,
  SnapshotMeta,
  SnapshotResult as LegacySnapshotResult,
} from "../contracts/snapshotPort.contract";
import type { VfsPort as LegacyVfsPort } from "../contracts/vfsPort.contract";
import type { SnapshotPort as NarrowSnapshotPort, SnapshotResult as NarrowSnapshotResult } from "../ports/snapshot.contract";

type SnapshotBlob = { meta: SnapshotMeta; dump: Record<string, unknown> };

function nowIso(): string {
  return new Date().toISOString();
}

export function createMemorySnapshot(vfs: LegacyVfsPort): LegacySnapshotPort {
  const byTenantNs = new Map<string, SnapshotBlob[]>();

  function key(t: string, ns: string): string {
    return `${t}::${ns}`;
  }

  function dumpNamespace(t: string, ns: string): Record<string, unknown> {
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
    const store: Map<string, unknown> | undefined = (vfs as any)?.__store;
    if (!store) return;
    for (const [kk, vv] of Object.entries(dump)) store.set(kk, vv);
  }

  return {
    async create(cmd: SnapshotCreate): Promise<LegacySnapshotResult<string>> {
      const snapId = `snap_${cmd.tenantId}_${cmd.namespace}_${Date.now()}`;
      const meta: SnapshotMeta = { snapshotId: snapId, ts: nowIso(), reason: cmd.reason };
      const dump = dumpNamespace(cmd.tenantId, cmd.namespace);
      const k = key(cmd.tenantId, cmd.namespace);
      const arr = byTenantNs.get(k) || [];
      arr.unshift({ meta, dump });
      byTenantNs.set(k, arr);
      return { ok: true, value: snapId };
    },

    async restore(cmd: SnapshotRestore): Promise<LegacySnapshotResult<true>> {
      const k = key(cmd.tenantId, cmd.namespace);
      const arr = byTenantNs.get(k) || [];
      const found = arr.find((s) => s.meta.snapshotId === cmd.snapshotId);
      if (!found) return { ok: false, error: "ERR_SNAPSHOT_NOT_FOUND" };

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

    async list(cmd: SnapshotList): Promise<LegacySnapshotResult<readonly SnapshotMeta[]>> {
      const k = key(cmd.tenantId, cmd.namespace);
      const arr = byTenantNs.get(k) || [];
      return { ok: true, value: arr.map((s) => s.meta) };
    },
  };
}

export function makeMemorySnapshotProvider(): NarrowSnapshotPort {
  let n = 0;
  return {
    async createSnapshot(nameHint: string): Promise<NarrowSnapshotResult> {
      n += 1;
      return { ok: true, name: `${nameHint}:${n}` };
    },
  };
}
