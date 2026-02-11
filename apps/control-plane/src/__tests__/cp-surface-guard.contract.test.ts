import { describe, it, expect } from "vitest";
import { guardCpSurface } from "../core/runtime/cpSurfaceGuard";

describe("Move14: CP surface guard (contract)", () => {
  it("denies when runtime identity missing (stable reason code + redirect)", () => {
    const r = guardCpSurface({ tenantId: null, actorId: null, surfaceKey: "cp.users" });
    expect(r.allow).toBe(false);
    expect(r.reasonCode).toBe("ERR_RUNTIME_IDENTITY_UNAVAILABLE");
    expect(typeof r.redirectTo === "string" || r.redirectTo === null).toBe(true);
  });

  it("returns stable shape on allow path", () => {
    const r = guardCpSurface({ tenantId: "t1", actorId: "a1", surfaceKey: "cp.users" });
    expect(typeof r.allow).toBe("boolean");
    expect(typeof r.reasonCode).toBe("string");
    expect(typeof r.redirectTo === "string" || r.redirectTo === null).toBe(true);
  });
});
