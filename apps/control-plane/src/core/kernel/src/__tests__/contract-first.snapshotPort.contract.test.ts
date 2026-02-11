import { describe, it, expect } from "vitest";
import type { SnapshotPort, SnapshotCreate, SnapshotRestore, SnapshotList } from "../contracts/snapshotPort.contract";

describe("Contract-First: SnapshotPort (core-kernel contract)", () => {
  it("command shapes are stable", () => {
    const c: SnapshotCreate = { tenantId: "t1", namespace: "tenant/t1/overrides", reason: "ops", correlationId: "corr_1" };
    const r: SnapshotRestore = { tenantId: "t1", namespace: "tenant/t1/overrides", snapshotId: "s1", correlationId: "corr_2" };
    const l: SnapshotList = { tenantId: "t1", namespace: "tenant/t1/overrides" };
    expect(c.reason).toBe("ops");
    expect(r.snapshotId).toBe("s1");
    expect(l.namespace).toContain("tenant/");
  });

  it("port interface exists (compile-only)", () => {
    const _p: SnapshotPort | null = null;
    expect(_p).toBe(null);
  });
});
