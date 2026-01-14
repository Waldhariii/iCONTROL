import { describe, it, expect } from "vitest";

// We intentionally import the SSOT barrel and assert key symbols exist.
// This fails fast if exports are removed/renamed without intent.
import * as runtime from "../core/studio/runtime";

describe("runtime SSOT export surface (contract)", () => {
  it("exports the expected stable symbols", () => {
    // audit API
    expect(runtime).toHaveProperty("createAuditEmitter");

    // prod factory
    expect(runtime).toHaveProperty("mkRuntime");
    expect(runtime).toHaveProperty("mkStudioRuntime");
  });
});
