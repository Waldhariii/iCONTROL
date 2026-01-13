import { describe, it, expect, vi } from "vitest";

describe("Governance: UI modules have no import-time side effects", () => {
  it("importing access-denied page does not mutate location", async () => {
    const original = globalThis.location;
    const assign = vi.fn();
    const loc: any = { ...original, assign, hash: "" };
    Object.defineProperty(globalThis, "location", { value: loc, configurable: true });

    // Import should not trigger navigation at module top-level
    await import("../../../modules/core-system/ui/frontend-ts/pages/access-denied/index");

    expect(assign).not.toHaveBeenCalled();
    expect(globalThis.location.hash).toBe("");
  });
});
