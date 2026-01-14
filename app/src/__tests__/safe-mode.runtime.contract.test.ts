import { describe, it, expect, vi } from "vitest";
import { applySafeModeSignal } from "../policies/safe_mode.runtime";

describe("SAFE_MODE runtime (audit-only)", () => {
  it("publishes __SAFE_MODE__ and audits once", () => {
    const emit = vi.fn();
    const rt: any = { audit: { emit } };

    applySafeModeSignal(rt, { enabled: true, reason: "maintenance" });
    expect(rt.__SAFE_MODE__).toBeTruthy();
    expect(rt.__SAFE_MODE__.enabled).toBe(true);

    const calls = emit.mock.calls.length;
    applySafeModeSignal(rt, { enabled: true });
    expect(emit.mock.calls.length).toBe(calls);
  });

  it("does not throw without audit emitter", () => {
    const rt: any = {};
    expect(() => applySafeModeSignal(rt, { enabled: false })).not.toThrow();
    expect(rt.__SAFE_MODE__).toBeTruthy();
  });
});
