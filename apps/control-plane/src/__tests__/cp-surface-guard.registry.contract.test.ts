import { describe, it, expect } from "vitest";
import { guardCpSurface } from "../core/runtime/cpSurfaceGuard";

describe("Move15: CP surface guard consumes registry (contract)", () => {
  it("denies when identity missing using stable reason code", () => {
    const r = guardCpSurface({ tenantId: null, actorId: null, surfaceKey: "cp.entitlements" });
    expect(r.allow).toBe(false);
    expect(r.reasonCode).toBe("ERR_RUNTIME_IDENTITY_UNAVAILABLE");
  });

  it("returns stable shape on allow path", () => {
    const r = guardCpSurface({ tenantId: "t1", actorId: "a1", surfaceKey: "cp.settings" });
    expect(typeof r.allow).toBe("boolean");
    expect(typeof r.reasonCode).toBe("string");
    expect(typeof r.redirectTo === "string" || r.redirectTo === null).toBe(true);
  });
});
