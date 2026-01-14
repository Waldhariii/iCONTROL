import { describe, it, expect, vi } from "vitest";
import type { AuditEmitFn } from "./_helpers/mkStudioRuntime";
import { mkStudioRuntime } from "./_helpers/mkStudioRuntime";

describe("StudioRuntime audit.emit shape (contract)", () => {
  it("exposes audit.emit(level, code, meta?) with stable signature", () => {
    const emit = vi.fn() as unknown as AuditEmitFn;
    const rt = mkStudioRuntime({ level: "HARD", emit });

    rt.audit.emit("WARN", "WARN_TEST_SHAPE", { k: "v" });

    expect(emit).toHaveBeenCalledTimes(1);
    const [lvl, code, meta] = emit.mock.calls[0];
    expect(lvl).toBe("WARN");
    expect(code).toBe("WARN_TEST_SHAPE");
    expect(meta).toEqual({ k: "v" });
  });
});
