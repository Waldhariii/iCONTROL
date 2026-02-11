// @ts-nocheck
import { describe, it, expect, vi } from "vitest";

describe("blocked page (import-safe)", () => {
  it("importing blocked page does not navigate()", async () => {
    const nav = await import("../../../../../../apps/control-plane/src/runtime/navigate");
    const spy = vi.spyOn(nav, "navigate");
    await import("./index");
    expect(spy).not.toHaveBeenCalled();
  });
});
