import { describe, it, expect } from "vitest";
import type { StudioRuntime } from "../core/studio/runtime";
import { mkRuntime, createAuditEmitter } from "../core/studio/runtime";

describe("SAFE_MODE factory invariant (contract)", () => {
  it("mkRuntime(enforcement:HARD) produces runtime with deterministic write policy", () => {
    const audit = createAuditEmitter(() => void 0);

    const rt: StudioRuntime = mkRuntime({
      audit,
      safeMode: {
        enabled: true,
        enforcement: {
          level: "HARD",
          scope: ["write"],
          blocked_actions: ["update"],
          allow_bypass_capabilities: [],
        },
      },
    });

    const enf = rt?.__SAFE_MODE__?.enforcement;
    expect(enf?.level).toBe("HARD");
    expect(Array.isArray(enf?.allow_bypass_capabilities)).toBe(true);
    expect(enf?.allow_bypass_capabilities.length).toBe(0);
  });
});
