// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("APP/CP guard (contract) — APP blocks CP routes", () => {
  let original: Location;

  beforeEach(() => {
    vi.resetModules();
    original = window.location;
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/app/",
        hash: "#/cp/system",
        replace: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_APP_KIND: "CLIENT_APP",
    };
    (globalThis as any).__ICONTROL_APP_KIND__ = "APP";
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

  it("redirects to /app/#/login when APP tries to hit CP", async () => {
    // lazy import main to run guard
    await import("../main");
    expect((globalThis as any).__ICONTROL_LAST_REDIRECT__).toBe("/app/#/login");
  });
});
