import { describe, it, expect } from "vitest";
import { enforceCpSurfaceAccess } from "../core/ports/cpSurfaceEnforcement";
import { REASON_CODES_V1 } from "../core/ports/reasonCodes.v1";

// Contract: reason returned must belong to frozen registry
describe("Move8: CP users enforcement reason codes (freeze)", () => {
  it("reason is part of REASON_CODES_V1", async () => {
    const d = await enforceCpSurfaceAccess({
      tenantId: "t1",
      actorId: "admin1",
      surfaceKey: "cp.users",
      action: "read",
      resource: "users",
    });

    // registry is a string array OR map; support both safely
    const list = Array.isArray(REASON_CODES_V1)
      ? REASON_CODES_V1
      : Object.values(REASON_CODES_V1 as any);

    expect(list.includes(d.reason)).toBe(true);
  });
});
