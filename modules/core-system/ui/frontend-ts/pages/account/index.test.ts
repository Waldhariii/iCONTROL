// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderAccount } from "./index";

afterEach(() => {
  clearSession();
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
});

describe("account page", () => {
  it("renders when RBAC allows", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";

    const root = document.createElement("div");
    renderAccount(root);
    expect(root.textContent || "").toContain("Compte");
  });
});
