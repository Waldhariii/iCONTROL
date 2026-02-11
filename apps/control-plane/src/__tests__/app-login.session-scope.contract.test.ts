// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authenticate } from "../localAuth";

describe("APP login session scope (contract)", () => {
  const originalLocation = window.location;
  const originalCookie = Object.getOwnPropertyDescriptor(
    window.document,
    "cookie",
  );

  let cookieWrites: string[] = [];

  beforeEach(() => {
    cookieWrites = [];
    // @ts-expect-error test override
    delete (window as any).location;
    (window as any).location = {
      pathname: "/app/",
      hash: "#/login",
      replace: vi.fn(),
    };
    // Set VITE_APP_KIND for resolveAuthScope() to detect APP scope
    // Note: resolveAuthScope() checks import.meta.env.VITE_APP_KIND first, then pathname
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_APP_KIND: "APP",
    };
    // Also set on globalThis as fallback (for __ICONTROL_APP_KIND__)
    (globalThis as any).__ICONTROL_APP_KIND__ = "APP";

    Object.defineProperty(window.document, "cookie", {
      configurable: true,
      get() {
        return cookieWrites.join("; ");
      },
      set(v: string) {
        cookieWrites.push(v);
      },
    });

    // Clear localStorage before test
    try {
      localStorage.removeItem("icontrol_session_v1");
      localStorage.removeItem("icontrol_mgmt_session_v1");
    } catch {}
  });

  afterEach(() => {
    // @ts-expect-error restore
    (window as any).location = originalLocation;
    if (originalCookie) {
      Object.defineProperty(window.document, "cookie", originalCookie);
    }
  });

  it("writes only APP session key and Path=/app cookie", () => {
    const res = authenticate("admin", "admin", "APP");
    expect(res.ok).toBe(true);

    expect(localStorage.getItem("icontrol_session_v1")).toBeTruthy();
    expect(localStorage.getItem("icontrol_mgmt_session_v1")).toBeNull();

    expect(
      cookieWrites.some(
        (c) => c.includes("icontrol_session_v1=") && c.includes("Path=/app"),
      ),
    ).toBe(true);
    expect(
      cookieWrites.some(
        (c) =>
          c.includes("icontrol_mgmt_session_v1=") && c.includes("Path=/cp"),
      ),
    ).toBe(false);
  });
});
