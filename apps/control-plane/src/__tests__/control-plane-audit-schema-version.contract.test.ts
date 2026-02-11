import { describe, it, expect } from "vitest";
import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";

describe("control plane — audit schema version (contract)", () => {
  it("publishes __CONTROL_PLANE_AUDIT_SCHEMA_VERSION__ = 1", () => {
    const runtime: any = { __tenant: "default" };
    applyControlPlaneBootGuards(runtime);
    expect(runtime.__CONTROL_PLANE_AUDIT_SCHEMA_VERSION__).toBe(1);
  });

  it("does not regress when applyControlPlaneBootGuards is called twice", () => {
    const runtime: any = { __tenant: "default" };
    applyControlPlaneBootGuards(runtime);
    applyControlPlaneBootGuards(runtime);
    expect(runtime.__CONTROL_PLANE_AUDIT_SCHEMA_VERSION__).toBe(1);
  });
});
