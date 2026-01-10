// @vitest-environment jsdom
import { describe, expect, it, afterEach } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderDeveloper } from "./index";

afterEach(() => {
  clearSession();
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
});

describe("developer page", () => {
  it("renders when RBAC allows", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";

    const root = document.createElement("div");
    renderDeveloper(root);
    expect(root.textContent || "").toContain("Developpeur");
  });
});
