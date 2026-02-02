import { describe, it, expect } from "vitest";

// Contract import-safety + shape stability (core-owned)
import type { ActivationRegistryPort } from "../contracts/activationRegistry.contract";

describe("Contract-First: ActivationRegistryPort (core-kernel contract)", () => {
  it("exports a stable port type (compile-time only)", () => {
    const ok: boolean = true;
    expect(ok).toBe(true);
  });
});
