import { describe, it, expect, vi } from "vitest";
import type { AuditEmitFn } from "./_helpers/mkStudioRuntime";
import { mkStudioRuntime } from "./_helpers/mkStudioRuntime";

describe("StudioRuntime SAFE_MODE shape (contract)", () => {
  it("exposes __SAFE_MODE__ with enabled + enforcement shape when configured", () => {
    const emit = vi.fn() as unknown as AuditEmitFn;
    const rt = mkStudioRuntime({ level: "HARD", emit });

    expect(rt.__SAFE_MODE__).toBeDefined();
    expect(rt.__SAFE_MODE__?.enabled).toBe(true);

    const enf = rt.__SAFE_MODE__?.enforcement;
    expect(enf).toBeDefined();
    expect(enf?.level).toBe("HARD");

    expect(Array.isArray(enf?.scope)).toBe(true);
    expect(Array.isArray(enf?.blocked_actions)).toBe(true);
    expect(Array.isArray(enf?.allow_bypass_capabilities)).toBe(true);
  });
});
