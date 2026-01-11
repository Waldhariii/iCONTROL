import { describe, it, expect } from "vitest";
import { getSafeMode } from "./recommendations.ctx";

describe("recommendations ctx", () => {
  it("defaults SAFE_MODE to COMPAT", () => {
    (globalThis as any).ICONTROL_SAFE_MODE = undefined;
    expect(getSafeMode()).toBe("COMPAT");
  });
});
