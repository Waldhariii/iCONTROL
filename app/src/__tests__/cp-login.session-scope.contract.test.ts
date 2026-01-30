// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authenticateManagement } from "../localAuth";

describe("CP login session scope (contract)", () => {
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
      pathname: "/cp/",
      hash: "#/dashboard",
      replace: vi.fn(),
    };
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_APP_KIND: "CONTROL_PLANE",
    };

    Object.defineProperty(window.document, "cookie", {
      configurable: true,
      get() {
        return cookieWrites.join("; ");
      },
      set(v: string) {
        cookieWrites.push(v);
      },
    });

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

  it("writes only CP session key and Path=/cp cookie", () => {
    const res = authenticateManagement("admin", "admin");
    expect(res.ok).toBe(true);

    expect(localStorage.getItem("icontrol_mgmt_session_v1")).toBeTruthy();
    expect(localStorage.getItem("icontrol_session_v1")).toBeNull();

    expect(
      cookieWrites.some(
        (c) =>
          c.includes("icontrol_mgmt_session_v1=") && c.includes("Path=/cp"),
      ),
    ).toBe(true);
    expect(
      cookieWrites.some(
        (c) => c.includes("icontrol_session_v1=") && c.includes("Path=/app"),
      ),
    ).toBe(false);
  });
});
