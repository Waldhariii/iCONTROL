import { describe, it, expect } from "vitest";
import { governedRedirect } from "../core/runtime/governedRedirect";

describe("Move9: governed redirect (contract)", () => {
  it("does not throw on blocked redirect", () => {
    expect(() => governedRedirect({ kind: "blocked", reason: "ERR_POLICY_DENY" })).not.toThrow();
  });
});
