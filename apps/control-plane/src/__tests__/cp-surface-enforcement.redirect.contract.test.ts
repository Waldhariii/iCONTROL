import { describe, it, expect } from "vitest";
import { redirectOnDeny } from "../core/ports/cpSurfaceEnforcement";

describe("Move9: surface enforcement redirect helper (contract)", () => {
  it("does not throw when decision is deny", () => {
    expect(() => redirectOnDeny({ allow: false, reason: "ERR_POLICY_DENY" }, "CP")).not.toThrow();
  });
});
