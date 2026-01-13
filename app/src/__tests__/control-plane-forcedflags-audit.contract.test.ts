import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the module exactly as imported by control_plane.runtime.ts ("./feature_flags.capabilities")
vi.mock("../policies/feature_flags.capabilities", async () => {
  return {
    forcedOffFlagsFromCapabilities: () => ["f.x", "f.y"],
  };
});

import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("control plane — forced flags audit emission (contract)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits WARN_FLAGS_FORCED_OFF once when capabilities force flags OFF (idempotent)", () => {
    const emit = vi.fn();

    const runtime: any = {
      __tenant: "default",
      audit: { emit },
    };

    applyControlPlaneBootGuards(runtime);

    const calls = emit.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);

    const hasForcedWarn = calls.some(
      (c: any[]) => c?.[0] === "WARN" && c?.[1] === (ERROR_CODES.WARN_FLAGS_FORCED_OFF ?? "WARN_FLAGS_FORCED_OFF")
    );
    expect(hasForcedWarn).toBe(true);

    const callsAfterFirst = emit.mock.calls.length;

    applyControlPlaneBootGuards(runtime);
    expect(emit.mock.calls.length).toBe(callsAfterFirst);
  });

  it("does not throw if audit emitter absent", () => {
    const runtime: any = { __tenant: "default" };
    expect(() => applyControlPlaneBootGuards(runtime)).not.toThrow();
  });
});
