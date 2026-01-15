// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("APP/CP guard (contract) — CP blocks APP routes", () => {
  let original: Location;

  beforeEach(() => {
    original = window.location;
    // @ts-expect-error test override
    delete (window as any).location;
    (window as any).location = {
      pathname: "/cp/",
      hash: "#/app/dashboard",
      replace: vi.fn(),
    };
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_APP_KIND: "CONTROL_PLANE",
    };
  });

  afterEach(() => {
    // @ts-expect-error restore
    (window as any).location = original;
  });

  it("redirects to /cp/#/login when CP tries to hit APP", async () => {
    await import("../main");
    expect((window.location as any).replace).toHaveBeenCalledTimes(1);
    expect((window.location as any).replace).toHaveBeenCalledWith(
      "/cp/#/login",
    );
  });
});
