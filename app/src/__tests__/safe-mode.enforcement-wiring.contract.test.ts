import { describe, it, expect, vi } from "vitest";
import { DataSourceRouter } from "../core/studio/datasources/router";

import { mkStudioRuntime } from "./_helpers/mkStudioRuntime";
import type { AuditEmitFn } from "./_helpers/mkStudioRuntime";

/**
 * P0.7 contract: real write gateway must consult SAFE_MODE enforcement.
 * We target the studio DataSourceRouter.write(), which is the canonical routing point to ds.write().
 */

function mkRouter(level: "SOFT" | "HARD", emit: AuditEmitFn) {
  const rt = mkStudioRuntime({ level, emit });
  const ds: any = {
    id: "mem",
    read: vi.fn(() => ({ ok: true, value: null })),
    write: vi.fn(() => ({ ok: true })),
  };
  const router = new DataSourceRouter(rt);
  (router as any).register(ds);
  return { router, ds };
}

describe("SAFE_MODE enforcement wiring (P0.7)", () => {
  it("HARD blocks writes (throws ERR_SAFE_MODE_WRITE_BLOCKED)", () => {
    const emit = vi.fn() as unknown as AuditEmitFn;
    const { router } = mkRouter("HARD", emit);

    expect(() => router.write("mem", "k1", "v1")).toThrowError(
      /ERR_SAFE_MODE_WRITE_BLOCKED/,
    );
  });

  it("SOFT allows writes but emits WARN_SAFE_MODE_WRITE_SOFT audit", () => {
    const emit = vi.fn() as unknown as AuditEmitFn;
    const { router, ds } = mkRouter("SOFT", emit);
    expect(() => router.write("mem", "k1", "v1")).not.toThrow();
    expect(ds.write).toHaveBeenCalledTimes(1);

    expect(emit).toHaveBeenCalled();
    expect(emit.mock.calls.some((c) => c?.[0] === "WARN")).toBe(true);
  });
});
