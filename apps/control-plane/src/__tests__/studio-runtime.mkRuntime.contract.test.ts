import { describe, it, expect, vi } from "vitest";
import type { StudioRuntime } from "../core/studio/runtime";
import { mkRuntime, createAuditEmitter } from "../core/studio/runtime";

describe("mkRuntime (contract)", () => {
  it("creates a StudioRuntime with audit.emit wired", () => {
    const sink = vi.fn();
    const emit = createAuditEmitter(sink);
    const rt: StudioRuntime = mkRuntime({
      enforcement: { level: "HARD" },
      audit: { emit },
    });

    rt.audit.emit("WARN", "WARN_MKRUNTIME_CONTRACT", { ok: true });

    expect(sink).toHaveBeenCalledTimes(1);
    const [lvl, code, meta] = sink.mock.calls[0];
    expect(lvl).toBe("WARN");
    expect(code).toBe("WARN_MKRUNTIME_CONTRACT");
    expect(meta).toEqual({ ok: true });
  });
});
