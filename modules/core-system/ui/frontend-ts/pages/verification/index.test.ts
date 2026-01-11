// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderVerification, verificationSections } from "./index";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

beforeEach(() => {
  (globalThis as any).localStorage = createLocalStorageMock();
});

afterEach(() => {
  clearSession();
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
});

describe("verification page", () => {
  it("renders when RBAC allows", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";

    const root = document.createElement("div");
    renderVerification(root);
    expect(root.textContent || "").toContain("Verification");
    expect(verificationSections.length).toBe(3);
    expect(root.textContent || "").toContain("SAFE_MODE");
    expect(root.innerHTML).not.toMatch(/\\bon\\w+\\s*=/i);
  });
});
