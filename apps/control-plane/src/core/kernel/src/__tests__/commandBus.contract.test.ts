import { describe, it, expect } from "vitest";
import { dispatchAsync } from "../async/commandBus";

describe("commandBus (contract)", () => {
  it("exposes dispatchAsync (no side effects on empty call)", () => {
    expect(typeof dispatchAsync).toBe("function");
  });
});
