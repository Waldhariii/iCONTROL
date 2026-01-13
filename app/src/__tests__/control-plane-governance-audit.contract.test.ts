import { describe, it, expect, vi } from "vitest";
import { applyControlPlaneBootGuards } from "../policies/control_plane.runtime";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("control plane — governance audit emission (contract)", () => {
  it("publishes __ffGovernanceAudit and emits WARNs once (idempotent)", () => {
    const emit = vi.fn();

    const runtime: any = {
      __featureFlags: { flags: { "f.x": { state: "ON" } } },
      audit: { emit },
    };

    applyControlPlaneBootGuards(runtime);

    expect(runtime.__FF_GOV_AUDITED__).toBe(true);
    expect(Array.isArray(runtime.__ffGovernanceAudit)).toBe(true);
    expect(runtime.__ffGovernanceAudit.length).toBeGreaterThanOrEqual(1);

    const sample: any = runtime.__ffGovernanceAudit[0];
    expect(sample.ts).toBeDefined();
    expect(typeof sample.ts).toBe("string");
    expect(sample.module).toBe("control_plane");
    expect(sample.scope).toBe("feature_flags_governance");
    expect(sample.source).toBe("feature_flags_governance");

    const hasOwnerMissing = runtime.__ffGovernanceAudit.some(
      (e: any) => e.code === ERROR_CODES.WARN_FLAG_OWNER_MISSING
    );
    expect(hasOwnerMissing).toBe(true);

    const callsAfterFirst = emit.mock.calls.length;

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

  it("sets __FF_GOV_AUDIT_FAILED__ when governance audit throws (no throw outward)", async () => {
    vi.resetModules();
    vi.doMock("../policies/feature_flags.governance", () => {
      return {
        auditGovernedFeatureFlags: () => {
          throw new Error("boom");
        },
      };
    });

    const mod = await import("../policies/control_plane.runtime");
    const boot = (mod as any).applyControlPlaneBootGuards as (w: any) => void;

    const runtime: any = {
      __featureFlags: { flags: { "f.x": { state: "ON" } } },
    };

    expect(() => boot(runtime)).not.toThrow();
    expect(runtime.__FF_GOV_AUDIT_FAILED__).toBe(true);
  });
});
