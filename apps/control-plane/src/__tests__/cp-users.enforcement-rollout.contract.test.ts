import { describe, it, expect } from "vitest";
import { enforceCpSurfaceAccess } from "../core/ports/cpSurfaceEnforcement";

// Contract: enforcement returns stable decision shape + reason code string
describe("Move8: CP users surface enforcement rollout (contract)", () => {
  it("returns {allow:boolean, reason:string} deterministically", async () => {
    const d = await enforceCpSurfaceAccess({
      tenantId: "t1",
      actorId: "admin1",
      surfaceKey: "cp.users",
      action: "read",
      resource: "users",
    });

    expect(typeof d.allow).toBe("boolean");
    expect(typeof d.reason).toBe("string");
    expect(d.reason.length).toBeGreaterThan(0);
  });
});
