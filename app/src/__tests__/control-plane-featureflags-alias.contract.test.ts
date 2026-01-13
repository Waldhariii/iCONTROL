import { describe, it, expect } from "vitest";
import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";

describe("control plane — feature flags canonical alias (contract)", () => {
  it("publishes __featureFlags as canonical alias of __FEATURE_FLAGS__/__FEATURE_DECISIONS__", () => {
    const runtime: any = { __tenant: "default" };

    applyControlPlaneBootGuards(runtime);

    expect(runtime.__FEATURE_FLAGS__).toBeTruthy();
    expect(runtime.__FEATURE_DECISIONS__).toBeTruthy();

    expect(runtime.__featureFlags).toBeTruthy();
    expect(runtime.__featureFlags.flags).toBe(runtime.__FEATURE_FLAGS__);
    expect(runtime.__featureFlags.decisions).toBe(runtime.__FEATURE_DECISIONS__);
  });
});
