import { describe, it, expect, vi } from "vitest";
import { createRedirectAdapter } from "../core/runtime/redirectAdapter.impl";

describe("Move10: RedirectAdapter impl (contract)", () => {
  it("calls window.location.assign with a computed href", () => {
    const assign = vi.fn();
    const g = globalThis as { window?: unknown };
    const prevWindow = g.window;
    g.window = {
      location: {
        origin: "http://localhost",
        pathname: "/app/",
        href: "http://localhost/app/#/current",
        assign,
      },
    };

    try {
      const a = createRedirectAdapter();
      a.redirect({ kind: "blocked", reason: "ERR_POLICY_DENY" });
      expect(assign).toHaveBeenCalledTimes(1);
    } finally {
      if (typeof prevWindow === "undefined") {
        delete g.window;
      } else {
        g.window = prevWindow;
      }
    }
  });
});
