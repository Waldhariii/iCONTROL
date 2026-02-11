import { describe, it, expect } from "vitest";
import { bindVfsPort, getVfsPort, bindSnapshotPort, getSnapshotPort } from "../core/ports";

describe("VFS/Snapshot ports exports (contract)", () => {
  it("throws when not bound", () => {
    expect(() => getVfsPort()).toThrow(/ERR_VFS_NOT_BOUND/);
    expect(() => getSnapshotPort()).toThrow(/ERR_SNAPSHOT_NOT_BOUND/);
  });

  it("binds and returns same port object", async () => {
    const fakeVfs = {
      read: async () => ({ ok: true as const, value: null }),
      write: async () => ({ ok: true as const, value: true as const }),
      del: async () => ({ ok: true as const, value: true as const })
    };
    const fakeSnap = {
      create: async () => ({ ok: true as const, value: "s1" }),
      restore: async () => ({ ok: true as const, value: true as const }),
      list: async () => ({ ok: true as const, value: [] as const })
    };
    bindVfsPort(fakeVfs as any);
    bindSnapshotPort(fakeSnap as any);
    expect(getVfsPort()).toBe(fakeVfs as any);
    expect(getSnapshotPort()).toBe(fakeSnap as any);
  });
});
