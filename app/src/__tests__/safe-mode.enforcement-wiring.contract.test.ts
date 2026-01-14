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
  it("HARD blocks writes (throws ERR_SAFE_MODE_WRITE_BLOCKED)", () => {
    const emit = vi.fn();
    const rt: any = {
      audit: { emit },
      __SAFE_MODE__: {
        enabled: true,
        enforcement: {
          level: "HARD",
          scope: ["write"],
          blocked_actions: ["update", "create", "delete"],
          message: "Maintenance",
        },
      },
    };

    (globalThis as any).__SAFE_MODE__ = rt.__SAFE_MODE__;
    (globalThis as any).audit = rt.audit;

    const { router } = mkRouter();

    expect(() => router.write("mem", "k1", "v1")).toThrowError(
      /ERR_SAFE_MODE_WRITE_BLOCKED/,
    );
  });

  it("SOFT allows writes but emits WARN_SAFE_MODE_WRITE_SOFT audit", () => {
    const emit = vi.fn();
    const rt: any = {
      audit: { emit },
      __SAFE_MODE__: {
        enabled: true,
        enforcement: {
          level: "SOFT",
          scope: ["write"],
          blocked_actions: ["update", "create", "delete"],
          message: "Maintenance",
        },
      },
    };

    (globalThis as any).__SAFE_MODE__ = rt.__SAFE_MODE__;
    (globalThis as any).audit = rt.audit;

    const { router, ds } = mkRouter();

    expect(() => router.write("mem", "k1", "v1")).not.toThrow();
    expect(ds.write).toHaveBeenCalledTimes(1);

    expect(emit).toHaveBeenCalled();
    expect(emit.mock.calls[0]?.[0]).toBe("WARN");
  });
});
