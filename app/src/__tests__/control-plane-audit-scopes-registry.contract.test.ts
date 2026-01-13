import { describe, it, expect, vi } from "vitest";
import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";
import { AUDIT_SCOPES } from "../policies/audit.scopes";

describe("control plane — audit scope registry (contract)", () => {
  it("emits audit events whose scope is from the registry", () => {
    const emit = vi.fn();
    const runtime: any = {
      __featureFlags: { flags: { "f.x": { state: "ON" } } },
      audit: { emit },
    };

    applyControlPlaneBootGuards(runtime);

    const calls = emit.mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const payload = calls[0][3];
    const registry = Object.values(AUDIT_SCOPES);
    expect(registry.includes(payload.scope)).toBe(true);
  });
});
