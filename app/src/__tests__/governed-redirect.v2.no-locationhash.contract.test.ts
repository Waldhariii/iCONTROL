import { describe, it, expect, vi } from "vitest";
import { governedRedirect, _setRedirectAdapterForTests } from "../core/runtime/governedRedirect";
import type { RedirectAdapter, RedirectTarget } from "../core/ports/redirect.adapter";

describe("Move10: governedRedirect v2 (contract)", () => {
  it("delegates to adapter.redirect and does not throw", () => {
    const spy = vi.fn();
    const fake: RedirectAdapter = { redirect: (t: RedirectTarget) => spy(t) };
    // @ts-expect-error test injection
    _setRedirectAdapterForTests(fake as any);

    expect(() => governedRedirect({ kind: "blocked", reason: "ERR_POLICY_DENY" })).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
