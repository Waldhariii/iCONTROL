import { describe, it, expect, vi } from "vitest";
import { createRedirectAdapter } from "../core/runtime/redirectAdapter.impl";

describe("Move10: RedirectAdapter impl (contract)", () => {
  it("calls window.location.assign with a computed href", () => {
    const assign = vi.fn();
    const orig = window.location.assign;
    // @ts-expect-error monkeypatch for test
    window.location.assign = assign;

    try {
      const a = createRedirectAdapter();
      a.redirect({ kind: "blocked", reason: "ERR_POLICY_DENY" });
      expect(assign).toHaveBeenCalledTimes(1);
    } finally {
      // restore
      // @ts-expect-error restore
      window.location.assign = orig;
    }
  });
});
