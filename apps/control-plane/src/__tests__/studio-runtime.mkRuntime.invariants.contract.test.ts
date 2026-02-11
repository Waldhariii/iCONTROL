import { describe, it, expect, vi } from "vitest";
import type { StudioRuntime } from "../core/studio/runtime";
import { mkRuntime, createAuditEmitter } from "../core/studio/runtime";

describe("mkRuntime invariants (contract)", () => {
  it("creates a StudioRuntime with audit.emit wired", () => {
    const sink = vi.fn();
    const audit = createAuditEmitter(sink);

    const rt: StudioRuntime = mkRuntime({
      audit,
    });

    rt.audit.emit("WARN", "WARN_TEST_MKRUNTIME", { ok: true });
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it("fails fast when safeMode.enforcement.level is invalid", () => {
    const audit = createAuditEmitter(() => void 0);
    expect(() =>
      mkRuntime({
        audit,
        safeMode: {
          enabled: true,
          // @ts-expect-error contract: level must be SafeModeEnforcementLevel
          enforcement: { level: "NOPE" },
        },
      }),
    ).toThrow();
  });
});
