import { describe, it, expect, vi } from "vitest";
import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";

describe("control plane — audit event shape (contract)", () => {
  it("emits audit events with ts, module and scope", () => {
    const emit = vi.fn();
    const runtime: any = {
      __featureFlags: { flags: { "f.x": { state: "ON" } } },
      audit: { emit },
    };

    applyControlPlaneBootGuards(runtime);

    const calls = emit.mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const payload = calls[0][3];
    expect(payload.ts).toBeDefined();
    expect(typeof payload.ts).toBe("string");
    expect(payload.module).toBe("control_plane");
    expect(payload.scope).toBeDefined();
  });
});
