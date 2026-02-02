import { describe, it, expect } from "vitest";
import { createMemoryVfs } from "../core/testing/memoryVfs.provider";
import { createMemorySnapshot } from "../core/testing/memorySnapshot.provider";

describe("VFS + Snapshot rollback (e2e contract)", () => {
  it("write -> snapshot -> mutate -> restore -> read original", async () => {
    const vfs = createMemoryVfs();
    const snap = createMemorySnapshot(vfs);

    const tenantId = "t_phase5";
    const ns = `tenant/${tenantId}/overrides`;
    const key = "theme.json";

    // write v1
    const w1 = await vfs.write({ tenantId, namespace: ns, key, valueJson: { theme: "A" }, correlationId: "corr_w1" });
    expect(w1.ok).toBe(true);

    // snapshot
    const s1 = await snap.create({ tenantId, namespace: ns, reason: "test", correlationId: "corr_s1" });
    expect(s1.ok).toBe(true);

    // mutate
    const w2 = await vfs.write({ tenantId, namespace: ns, key, valueJson: { theme: "B" }, correlationId: "corr_w2" });
    expect(w2.ok).toBe(true);

    // restore
    const r = await snap.restore({ tenantId, namespace: ns, snapshotId: (s1 as any).value, correlationId: "corr_r1" });
    expect(r.ok).toBe(true);

    // read should be original
    const rr = await vfs.read({ tenantId, namespace: ns, key });
    expect(rr.ok).toBe(true);
    expect((rr as any).value).toEqual({ theme: "A" });
  });
});
