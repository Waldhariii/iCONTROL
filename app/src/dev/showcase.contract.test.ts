import { describe, it, expect } from "vitest";
import { installIControlShowcaseDEVOnly } from "./showcase";

describe("showcase (DEV-only) contract", () => {
  it("does not throw in non-browser environments (Vitest Node)", () => {
    expect(() => installIControlShowcaseDEVOnly()).not.toThrow();
  });

  it("SSOT: does not require window/document to exist", () => {
    // In Node, it should no-op safely.
    expect(() => installIControlShowcaseDEVOnly()).not.toThrow();
  });
});
