import { describe, it, expect } from "vitest";
import { createRuntimeIdentityPort } from "../core/runtime/runtimeIdentity.impl";

describe("Move11: RuntimeIdentityPort (contract)", () => {
  it("returns null when no identity and not dev/safe", () => {
    (globalThis as any).__ICONTROL_RUNTIME__ = undefined;
    (globalThis as any).__ICONTROL_SESSION__ = undefined;
    (globalThis as any).__ICONTROL_DEVONLY__ = false;
    (globalThis as any).__ICONTROL_SAFE_MODE__ = false;

    const p = createRuntimeIdentityPort();
    expect(p.tryGet()).toBeNull();
  });

  it("returns dev-default only when devonly marker is set", () => {
    (globalThis as any).__ICONTROL_RUNTIME__ = undefined;
    (globalThis as any).__ICONTROL_SESSION__ = undefined;
    (globalThis as any).__ICONTROL_DEVONLY__ = true;
    (globalThis as any).__ICONTROL_SAFE_MODE__ = false;

    const p = createRuntimeIdentityPort();
    const v = p.get();
    expect(v.tenantId).toBe("default");
    expect(v.actorId).toBe("dev");
    expect(v.source).toBe("dev-default");
  });

  it("prefers runtime/session identity over dev fallback", () => {
    (globalThis as any).__ICONTROL_DEVONLY__ = true;
    (globalThis as any).__ICONTROL_SAFE_MODE__ = false;
    (globalThis as any).__ICONTROL_RUNTIME__ = { tenantId: "t1", actorId: "a1" };

    const p = createRuntimeIdentityPort();
    const v = p.get();
    expect(v.tenantId).toBe("t1");
    expect(v.actorId).toBe("a1");
    expect(v.source).toBe("session");
  });

  it("strict get() throws when unavailable (prod path)", () => {
    (globalThis as any).__ICONTROL_RUNTIME__ = undefined;
    (globalThis as any).__ICONTROL_SESSION__ = undefined;
    (globalThis as any).__ICONTROL_DEVONLY__ = false;
    (globalThis as any).__ICONTROL_SAFE_MODE__ = false;

    const p = createRuntimeIdentityPort();
    expect(() => p.get()).toThrow(/ERR_RUNTIME_IDENTITY_UNAVAILABLE/);
  });
});
