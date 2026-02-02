import { describe, it, expect } from "vitest";
import type { VfsPort, VfsRead, VfsWrite, VfsDelete } from "../contracts/vfsPort.contract";

describe("Contract-First: VfsPort (core-kernel contract)", () => {
  it("types compile and command shapes are stable", () => {
    const r: VfsRead = { tenantId: "t1", namespace: "tenant/t1/overrides", key: "theme.json" };
    const w: VfsWrite = { tenantId: "t1", namespace: "tenant/t1/overrides", key: "theme.json", valueJson: { a: 1 }, correlationId: "corr_1" };
    const d: VfsDelete = { tenantId: "t1", namespace: "tenant/t1/overrides", key: "theme.json", correlationId: "corr_2" };
    expect(r.tenantId).toBe("t1");
    expect(w.correlationId).toBeTruthy();
    expect(d.key).toBe("theme.json");
  });

  it("port interface exists (compile-only)", () => {
    const _p: VfsPort | null = null;
    expect(_p).toBe(null);
  });
});
