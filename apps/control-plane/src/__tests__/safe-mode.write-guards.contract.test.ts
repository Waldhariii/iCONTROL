import { describe, expect, it, vi } from "vitest";
import { auditSafeModeWriteAttempt } from "../policies/safe_mode.write_guards.runtime";

describe("SAFE_MODE write guards — audit-only contract", () => {
  it("emits audit once (idempotent per op)", () => {
    const emit = vi.fn();
    const runtime: any = {
      __SAFE_MODE__: { enabled: true },
      audit: { emit },
    };

    auditSafeModeWriteAttempt(runtime, {
      op: "storage.write",
      target: "localStorage",
    });
    auditSafeModeWriteAttempt(runtime, {
      op: "storage.write",
      target: "localStorage",
    });

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("does not emit when SAFE_MODE disabled", () => {
    const emit = vi.fn();
    const runtime: any = {
      __SAFE_MODE__: { enabled: false },
      audit: { emit },
    };

    auditSafeModeWriteAttempt(runtime, { op: "job.update" });

    expect(emit).not.toHaveBeenCalled();
  });

  it("does not throw if audit emitter is absent", () => {
    const runtime: any = {
      __SAFE_MODE__: { enabled: true },
    };

    expect(() =>
      auditSafeModeWriteAttempt(runtime, { op: "storage.write" }),
    ).not.toThrow();
  });
});
