import { describe, it, expect } from "vitest";
import { validateRuntimeConfig } from "../platform/runtimeConfig/validateRuntimeConfig";

describe("runtime config (contract)", () => {
  it("accepts minimal valid config", () => {
    const raw = { schemaVersion: 1, defaultTier: "free", tenants: {} };
    const out = validateRuntimeConfig(raw, { source: "runtime", filePath: "X", sha256: "Y", loadedAt: new Date().toISOString(), mode: "test" });
    expect(out.config.schemaVersion).toBe(1);
    expect(out.config.defaultTier).toBe("free");
  });

  it("fails closed in prod on invalid config", () => {
    const raw = { schemaVersion: 1, defaultTier: "NOPE" };
    expect(() =>
      validateRuntimeConfig(raw, { source: "runtime", filePath: "X", sha256: "Y", loadedAt: new Date().toISOString(), mode: "prod" })
    ).toThrow();
  });
});
