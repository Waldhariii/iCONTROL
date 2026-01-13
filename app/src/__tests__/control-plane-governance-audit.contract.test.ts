import { describe, it, expect, vi } from "vitest";
import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";

vi.mock("../policies/feature_flags.governance", async () => {
  return {
    auditGovernedFeatureFlags: () => {
      throw new Error("boom");
    },
  };
});
import { ERROR_CODES } from "../core/errors/error_codes";

describe("control plane — governance audit emission (contract)", () => {
  it("publishes __ffGovernanceAudit and emits WARNs once (idempotent)", () => {
    const emit = vi.fn();

    // Minimal runtime: provide feature flags with missing meta.owner to trigger governance WARN.
    const runtime: any = {
      __featureFlags: { flags: { "f.x": { state: "ON" } } },
      audit: { emit },
    };

    applyControlPlaneBootGuards(runtime);

    expect(runtime.__FF_GOV_AUDITED__).toBe(true);
    expect(Array.isArray(runtime.__ffGovernanceAudit)).toBe(true);
    expect(runtime.__ffGovernanceAudit.length).toBeGreaterThanOrEqual(1);

    // Ensure at least the owner-missing governance code is present
    const hasOwnerMissing = runtime.__ffGovernanceAudit.some((e: any) => e.code === ERROR_CODES.WARN_FLAG_OWNER_MISSING);
    expect(hasOwnerMissing).toBe(true);

    const callsAfterFirst = emit.mock.calls.length;

    // Call again: must not re-emit governance audit
    applyControlPlaneBootGuards(runtime);
    expect(emit.mock.calls.length).toBe(callsAfterFirst);
  });

  it("does not throw if audit emitter absent", () => {
    const runtime: any = {
      __featureFlags: { flags: { "f.x": { state: "ON" } } },
    };
    expect(() => applyControlPlaneBootGuards(runtime)).not.toThrow();
    expect(Array.isArray(runtime.__ffGovernanceAudit)).toBe(true);
  });


  it("sets __FF_GOV_AUDIT_FAILED__ when governance audit throws (no throw outward)", () => {
    const runtime: any = {
      __featureFlags: { flags: { "f.x": { state: "ON" } } },
    };
    expect(() => applyControlPlaneBootGuards(runtime)).not.toThrow();
    expect(runtime.__FF_GOV_AUDIT_FAILED__).toBe(true);
  });
});
