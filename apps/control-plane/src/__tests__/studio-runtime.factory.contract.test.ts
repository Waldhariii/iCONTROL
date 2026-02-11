import { describe, it, expect } from "vitest";
import { mkStudioRuntime } from "../core/studio/runtime";

describe("StudioRuntime factory (contract)", () => {
  it("mkStudioRuntime() returns runtime with audit.emit that never throws", () => {
    const rt = mkStudioRuntime();
    expect(rt).toBeTruthy();
    expect(rt.audit).toBeTruthy();
    expect(typeof rt.audit.emit).toBe("function");

    // must not throw even with undefined meta
    expect(() => rt.audit.emit("INFO", "INFO_FACTORY_NO_THROW")).not.toThrow();
    expect(() =>
      rt.audit.emit("WARN", "WARN_FACTORY_META", { k: "v" }),
    ).not.toThrow();
  });
});
