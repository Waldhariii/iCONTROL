import { describe, it, expect } from "vitest";
import { getRuntimeIdentity } from "../core/runtime/identity";

describe("Move9: runtime identity SSOT (contract)", () => {
  it("returns tenantId/actorId as non-empty strings", () => {
    const id = getRuntimeIdentity();
    expect(typeof id.tenantId).toBe("string");
    expect(typeof id.actorId).toBe("string");
    expect(id.tenantId.length).toBeGreaterThan(0);
    expect(id.actorId.length).toBeGreaterThan(0);
  });
});
