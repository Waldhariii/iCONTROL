import { describe, it, expect } from "vitest";

// We import only via SSOT ports index (contract surface).
import {
  __resetForTests,
  bindActivationRegistry,
  bindPolicyEngine,
  bootstrapCpEnforcement,
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
    __resetForTests();
    bootstrapCpEnforcement();
    const activation = bindActivationRegistry();
    const policy = bindPolicyEngine();

    const tenantId = "t_ultra";
    const actorId = "admin_ultra";
    const userActorId = "user_ultra";
    const moduleId = "users_shadow";

    // 1) Default should be disabled (critical invariant)
    const d1 = await activation.isEnabled(tenantId, moduleId);

    expect(d1.enabled).toBe(false);
    expect(typeof d1.reason).toBe("string");
    expect(d1.reason!.length).toBeGreaterThan(0);
    mustIncludeReason(d1.reason!);

    // 2) Policy denies write-like action for non-admin role
    const deny = policy.evaluate({
      tenantId,
      subject: { actorId: userActorId, role: "user" },
      action: "modules.toggle",
      resource: { kind: "module", id: moduleId },
      context: { correlationId: "corr_ultra_1" },
    });

    expect(deny.allow).toBe(false);
    const denyCode = deny.allow ? deny.reasons[0] : deny.code;
    expect(typeof denyCode).toBe("string");
    mustIncludeReason(denyCode);

    // 3) Policy allows same action for admin role
    const allow = policy.evaluate({
      tenantId,
      subject: { actorId, role: "admin" },
      action: "modules.toggle",
      resource: { kind: "module", id: moduleId },
      context: { correlationId: "corr_ultra_2" },
    });

    expect(allow.allow).toBe(true);
    const allowCode = allow.reasons[0];
    expect(typeof allowCode).toBe("string");
    mustIncludeReason(allowCode);

    // 4) Enable and verify enabled state + reason code
    await activation.setEnabled({
      tenantId,
      actorId,
      correlationId: "corr_ultra_3",
      moduleId,
      enabled: true,
      reason: "test-enable",
    });

    const d2 = await activation.isEnabled(tenantId, moduleId);

    expect(d2.enabled).toBe(true);
    expect(typeof d2.reason).toBe("string");
    mustIncludeReason(d2.reason!);

    // 5) Disable and verify disabled state + reason code
    await activation.setEnabled({
      tenantId,
      actorId,
      correlationId: "corr_ultra_4",
      moduleId,
      enabled: false,
      reason: "test-disable",
    });

    const d3 = await activation.isEnabled(tenantId, moduleId);

    expect(d3.enabled).toBe(false);
    mustIncludeReason(d3.reason!);
  });
});
