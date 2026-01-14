import { describe, it, expect, vi } from "vitest";
import { DataSourceRouter } from "../core/studio/datasources/router";

function mkRt(level: "SOFT" | "HARD", emit: any) {
  return {
    audit: { emit },
    __SAFE_MODE__: {
      enabled: true,
      enforcement: {
        level,
        scope: ["write"],
        blocked_actions: ["update"],
        allow_bypass_capabilities: [],
        message: "SAFE_MODE write policy",
      },
    },
  };
}

/**
 * P0.7 contract: real write gateway must consult SAFE_MODE enforcement.
 * We target the studio DataSourceRouter.write(), which is the canonical routing point to ds.write().
 */

function mkRouter() {
  const ds: any = {
    id: "mem",
    read: vi.fn(() => ({ ok: true, value: null })),
    write: vi.fn(() => ({ ok: true })),
  };

  const router = new (DataSourceRouter as any)();
  router.register(ds);
  return { router, ds };
}

describe("SAFE_MODE enforcement wiring (P0.7)", () => {
  it("requires router.rt (throws ERR_ROUTER_RUNTIME_REQUIRED when missing)", () => {
    const { router } = mkRouter();
    // no rt injection
    expect(() => router.write("mem", "k0", "v0")).toThrow(
      /ERR_ROUTER_RUNTIME_REQUIRED/,
    );
  });

  it("HARD blocks writes (throws ERR_SAFE_MODE_WRITE_BLOCKED)", () => {
    const emit = vi.fn();
    const { router } = mkRouter();
    (router as any).rt = mkRt("HARD", emit);

    expect(() => router.write("mem", "k1", "v1")).toThrowError(
      /ERR_SAFE_MODE_WRITE_BLOCKED/,
    );
  });

  it("SOFT allows writes but emits WARN_SAFE_MODE_WRITE_SOFT audit", () => {
    const emit = vi.fn();
    const { router, ds } = mkRouter();
    (router as any).rt = mkRt("SOFT", emit);
    expect(() => router.write("mem", "k1", "v1")).not.toThrow();
    expect(ds.write).toHaveBeenCalledTimes(1);

    expect(emit).toHaveBeenCalled();
    expect(emit.mock.calls.some((c) => c?.[0] === "WARN")).toBe(true);
  });
});
