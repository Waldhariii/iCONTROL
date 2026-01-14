import { describe, it, expect, vi } from "vitest";
import type { AuditLevel, StudioRuntime } from "../core/studio/runtime";
import { mkStudioRuntime } from "./_helpers/mkStudioRuntime";

describe("StudioRuntime audit.emit shape (contract)", () => {
  it("exposes audit.emit(level, code, meta?) with stable signature", () => {
    const emit = vi.fn();
    const rt: StudioRuntime = mkStudioRuntime({ level: "HARD", emit });

    rt.audit.emit("WARN" as AuditLevel, "WARN_TEST_SHAPE", { k: "v" });

    expect(emit).toHaveBeenCalledTimes(1);
    const [lvl, code, meta] = emit.mock.calls[0];
    expect(lvl).toBe("WARN");
    expect(code).toBe("WARN_TEST_SHAPE");
    expect(meta).toEqual({ k: "v" });
  });
});
