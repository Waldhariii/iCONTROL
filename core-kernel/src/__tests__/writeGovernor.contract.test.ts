import { describe, it, expect } from "vitest";
import { configureTenantBudget, guardWrite } from "../pressure/writeGovernor";

describe("writeGovernor (contract)", () => {
  it("exposes configureTenantBudget and guardWrite", () => {
    expect(typeof configureTenantBudget).toBe("function");
    expect(typeof guardWrite).toBe("function");
  });
});
