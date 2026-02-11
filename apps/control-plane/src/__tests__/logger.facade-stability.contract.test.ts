import { describe, it, expect, vi } from "vitest";

describe("logger facade stability (contract)", () => {
  it("exports stable API shape (legacy aliases preserved)", async () => {
    const mod = await import("../core/utils/logger");

    // Core exports (must exist)
    expect(typeof (mod as any).createLogger).toBe("function");
    expect(typeof (mod as any).getLogger).toBe("function");
    expect(typeof (mod as any).logInfo).toBe("function");
    expect(typeof (mod as any).logWarn).toBe("function");
    expect(typeof (mod as any).logError).toBe("function");

    // Legacy aliases (must exist)
    expect(typeof (mod as any).warnLog).toBe("function");
    expect(typeof (mod as any).debugLog).toBe("function");
    expect(typeof (mod as any).errorLog).toBe("function");
  });

  it("has no console.* usage at runtime (import-time) (fail-closed)", async () => {
    const spy = vi.spyOn(console, "log");
    const spy2 = vi.spyOn(console, "warn");
    const spy3 = vi.spyOn(console, "error");

    await import("../core/utils/logger");

    expect(spy).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();

    spy.mockRestore();
    spy2.mockRestore();
    spy3.mockRestore();
  });

  it("import has no side-effects (no init/write patterns) (heuristic)", async () => {
    // This is a light heuristic: importing must not throw and must not mutate known globals.
    const before = (globalThis as any).__ICONTROL_IMPORT_SIDE_EFFECTS__;
    await import("../core/utils/logger");
    const after = (globalThis as any).__ICONTROL_IMPORT_SIDE_EFFECTS__;
    expect(after).toBe(before);
  });
});
