// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("APP/CP guard (contract) — APP blocks CP routes", () => {
  let original: Location;

  beforeEach(() => {
    original = window.location;
    // @ts-expect-error test override
    delete (window as any).location;
    (window as any).location = {
      pathname: "/app/",
      hash: "#/cp/system",
      replace: vi.fn(),
    };
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_APP_KIND: "CLIENT_APP",
    };
  });

  afterEach(() => {
    // @ts-expect-error restore
    (window as any).location = original;
  });

  it("redirects to /app/#/login when APP tries to hit CP", async () => {
    // lazy import main to run guard
    await import("../main");
    expect((window.location as any).replace).toHaveBeenCalledTimes(1);
    expect((window.location as any).replace).toHaveBeenCalledWith(
      "/app/#/login",
    );
  });
});
