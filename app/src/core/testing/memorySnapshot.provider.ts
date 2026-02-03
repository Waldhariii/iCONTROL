import type { SnapshotPort, SnapshotResult } from "../ports/snapshot.contract";

export function makeMemorySnapshotProvider(): SnapshotPort {
  let n = 0;
  return {
    async createSnapshot(nameHint: string): Promise<SnapshotResult> {
      n += 1;
      return { ok: true, name: `${nameHint}:${n}` };
    },
  };
}
