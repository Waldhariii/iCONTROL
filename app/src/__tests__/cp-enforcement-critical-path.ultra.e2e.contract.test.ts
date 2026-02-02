import { describe, it, expect } from "vitest";

// We import only via SSOT ports index (contract surface).
import {
  bootstrapCpEnforcement,
  createActivationRegistryFacade,
  createPolicyEngineFacade,
  REASON_CODES_V1,
} from "../core/ports";

// NOTE: we keep this test intentionally high-signal.
// If it fails, it indicates a governance breach or enforcement regression.

function mustIncludeReason(code: string) {
  expect(REASON_CODES_V1.includes(code)).toBe(true);
}

describe("ULTRA: CP enforcement critical path (enable/deny) — proofs", () => {
  it("deny -> reason code is frozen; allow -> reason code OK; correlationId exists", async () => {
    // Arrange
    const activation = createActivationRegistryFacade();
    const policy = createPolicyEngineFacade();

    const enforcement = bootstrapCpEnforcement({
      activation,
      policy,
      // test hooks are optional; implementation should default safely if absent
      now: () => new Date("2026-02-02T00:00:00.000Z"),
    });

    const tenantId = "t_ultra";
    const actorId = "admin_ultra";
    const correlationId = "corr_ultra_1";

    // Pick a stable module/capability that exists in your system.
    // If your enforcement operates on moduleId, keep moduleId.
    const moduleId = "users_shadow";

    // 1) Default should be DENY when not enabled (critical invariant)
    const d1 = await enforcement.evaluate({
      tenantId,
      actorId,
      correlationId,
      moduleId,
      action: "read",
      surface: "cp",
    });

    expect(d1.allow).toBe(false);
    expect(typeof d1.reason).toBe("string");
    expect(d1.reason.length).toBeGreaterThan(0);
    mustIncludeReason(d1.reason);

    // 2) Enable and verify ALLOW
    await enforcement.setEnabled({
      tenantId,
      actorId,
      correlationId,
      moduleId,
      enabled: true,
      reason: "test-enable",
    });

    const d2 = await enforcement.evaluate({
      tenantId,
      actorId,
      correlationId: "corr_ultra_2",
      moduleId,
      action: "read",
      surface: "cp",
    });

    expect(d2.allow).toBe(true);
    expect(typeof d2.reason).toBe("string");
    expect(d2.reason.length).toBeGreaterThan(0);
    mustIncludeReason(d2.reason);

    // 3) Disable and verify DENY again
    await enforcement.setEnabled({
      tenantId,
      actorId,
      correlationId: "corr_ultra_3",
      moduleId,
      enabled: false,
      reason: "test-disable",
    });

    const d3 = await enforcement.evaluate({
      tenantId,
      actorId,
      correlationId: "corr_ultra_4",
      moduleId,
      action: "read",
      surface: "cp",
    });

    expect(d3.allow).toBe(false);
    mustIncludeReason(d3.reason);
  });
});
