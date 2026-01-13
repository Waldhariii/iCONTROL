import { describe, it, expect } from "vitest";
import { auditGovernedFeatureFlags } from "../policies/feature_flags.governance";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("feature flags governance (contract)", () => {
  it("warns when ON flag has no owner", () => {
    const audit = auditGovernedFeatureFlags({ flags: { "f.x": { state: "ON" } as any } }, { now_ms: Date.now() });
    expect(audit.some((e) => e.code === ERROR_CODES.WARN_FLAG_OWNER_MISSING)).toBe(true);
  });

  it("warns when expires_at is in the past", () => {
    const audit = auditGovernedFeatureFlags(
      { flags: { "f.y": { state: "ON", meta: { owner: "team", expires_at: "2000-01-01T00:00:00.000Z" } } as any } },
      { now_ms: Date.parse("2026-01-13T00:00:00.000Z") }
    );
    expect(audit.some((e) => e.code === ERROR_CODES.WARN_FLAG_EXPIRED)).toBe(true);
  });

  it("warns when meta shape is invalid", () => {
    const audit = auditGovernedFeatureFlags({ flags: { "f.z": { state: "OFF", meta: 123 } as any } });
    expect(audit.some((e) => e.code === ERROR_CODES.WARN_FLAG_META_INVALID)).toBe(true);
  });
});
