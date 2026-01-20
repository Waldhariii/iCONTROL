// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  authenticate,
  authenticateManagement,
  logout,
  logoutManagement,
} from "../localAuth";

let cookieStore = "";
const cookieSetter = vi.fn((value: string) => {
  cookieStore = value;
});

describe("auth cookies use SameSite=Strict and are scoped by Path", () => {
  beforeEach(() => {
    localStorage.clear();
    cookieStore = "";
    Object.defineProperty(document, "cookie", {
      get: () => cookieStore,
      set: cookieSetter,
      configurable: true,
    });
    // default path in tests
    Object.defineProperty(window, "location", {
      value: { protocol: "http:", pathname: "/app" },
      writable: true,
    });
  });

  it("APP writes cookie with Path=/app and SameSite=Strict", async () => {
    const res = await authenticate("admin", "admin", "APP");
    expect(res.ok).toBe(true);
    expect(document.cookie).toContain("icontrol_session_v1=1");
    expect(document.cookie).toContain("Path=/app");
    expect(document.cookie).toContain("SameSite=Strict");
    // jsdom doesn't expose attributes reliably; assert at least cookie key presence + session isolation
    expect(localStorage.getItem("icontrol_session_v1")).toBeTruthy();
    expect(localStorage.getItem("icontrol_mgmt_session_v1")).toBeNull();
    logout("APP");
  });

  it("CP writes cookie with Path=/cp and SameSite=Strict (management key)", async () => {
    const res = await authenticateManagement("admin", "admin");
    expect(res.ok).toBe(true);
    expect(document.cookie).toContain("icontrol_mgmt_session_v1=1");
    expect(document.cookie).toContain("Path=/cp");
    expect(document.cookie).toContain("SameSite=Strict");
    expect(localStorage.getItem("icontrol_mgmt_session_v1")).toBeTruthy();
    expect(localStorage.getItem("icontrol_session_v1")).toBeNull();
    logoutManagement();
  });
});
