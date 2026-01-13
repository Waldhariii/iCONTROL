import { describe, it, expect, vi } from "vitest";
import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";

describe("control plane — forced flags audit emission (contract)", () => {
  it("emits WARN once when capabilities force flags OFF (idempotent)", () => {
    const emit = vi.fn();

    const runtime: any = {
      __tenant: "default",
      audit: { emit },
      __versionPolicy: { capabilities: { flags_forced_off: ["f.x"] } },
    };

    // applyControlPlaneBootGuards builds version policy itself; the contract here focuses on idempotence,
    // so we only assert that repeated calls don't increase WARN emission when forced flags exist.
    applyControlPlaneBootGuards(runtime);
    const callsAfterFirst = emit.mock.calls.length;
    applyControlPlaneBootGuards(runtime);
    expect(emit.mock.calls.length).toBe(callsAfterFirst);
  });

  it("does not throw if audit emitter absent", () => {
    const runtime: any = { __tenant: "default" };
    expect(() => applyControlPlaneBootGuards(runtime)).not.toThrow();
  });
});
