// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderUsers } from "./index";

afterEach(() => {
  clearSession();
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
});

describe("users page", () => {
  it("renders when RBAC allows", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";

    const root = document.createElement("div");
    renderUsers(root);
    expect(root.textContent || "").toContain("Utilisateurs");
  });
});
