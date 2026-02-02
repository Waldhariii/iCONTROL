import { describe, it, expect } from "vitest";
import { enqueueTenant } from "../queues/tenantQueue";

describe("tenantQueue (contract)", () => {
  it("exposes enqueueTenant (deterministic shape)", () => {
    expect(typeof enqueueTenant).toBe("function");
  });
});
