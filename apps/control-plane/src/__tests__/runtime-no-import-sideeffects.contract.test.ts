import { describe, it, expect } from "vitest";

// Contract: importing runtime SSOT should not throw, and should not execute unexpected side effects.
// We keep this minimal; deeper audits are covered by existing suite.
describe("runtime no import-time side effects (contract)", () => {
  it("imports runtime SSOT without throwing", async () => {
    await expect(import("../core/studio/runtime")).resolves.toBeTruthy();
  });
});
