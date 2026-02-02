import { describe, it, expect } from "vitest";
import { createPolicyEngine } from "../engine";
import { POLICY_RULESET_V1 } from "../rules";
import type { Subject, PolicyContext } from "../types";

describe("PolicyEngine V1 (contract)", () => {
  const engine = createPolicyEngine(POLICY_RULESET_V1);

  const subj: Subject = {
    tenantId: "t1",
    userId: "u1",
    roles: ["user"],
  };

  it("denies by default when no rule applies", () => {
    const ctx: PolicyContext = { safeMode: false };
    const d = engine.evaluate({ subject: subj, action: "unknown.action", ctx });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe("ERR_POLICY_DENY_DEFAULT");
  });

  it("SAFE_MODE denies non-cp actions", () => {
    const ctx: PolicyContext = { safeMode: true };
    const d = engine.evaluate({ subject: subj, action: "jobs.read", ctx });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe("ERR_SAFE_MODE_DENY_NON_CP");
  });

  it("SAFE_MODE allows cp.* actions", () => {
    const ctx: PolicyContext = { safeMode: true };
    const d = engine.evaluate({ subject: subj, action: "cp.modules.toggle", ctx });
    expect(d.allow).toBe(true);
    expect(d.reason).toBe("OK_SAFE_MODE_CP_ALLOW");
  });

  it("activation gate denies module actions when disabled", () => {
    const ctx: PolicyContext = { safeMode: false, activation: { "module.jobs": "off" } };
    const d = engine.evaluate({ subject: subj, action: "jobs.read", ctx });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe("ERR_MODULE_DISABLED");
  });

  it("cp toggle requires admin role", () => {
    const ctx: PolicyContext = { safeMode: false };
    const d = engine.evaluate({ subject: subj, action: "cp.modules.toggle", ctx });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe("ERR_CP_TOGGLE_NOT_ADMIN");
  });
});
