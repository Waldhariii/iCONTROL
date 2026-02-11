// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("APP/CP guard (contract) — CP blocks APP routes", () => {
  let original: Location;

  beforeEach(() => {
    vi.resetModules();
    original = window.location;
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/cp/",
        hash: "#/app/dashboard",
        replace: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_APP_KIND: "CONTROL_PLANE",
    };
    (globalThis as any).__ICONTROL_APP_KIND__ = "CP";
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: original,
      writable: true,
      configurable: true,
    });
    delete (globalThis as any).__ICONTROL_APP_KIND__;
    delete (globalThis as any).__ICONTROL_LAST_REDIRECT__;
  });

  it("redirects to /cp/#/dashboard when CP tries to hit APP", async () => {
    await import("../main");
    expect((globalThis as any).__ICONTROL_LAST_REDIRECT__).toBe("/cp/#/dashboard");
  });
});
