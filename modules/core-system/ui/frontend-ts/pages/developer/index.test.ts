// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { developerSections, renderDeveloper } from "./index";

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

describe("developer page", () => {
  it("renders when RBAC allows", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";

    const root = document.createElement("div");
    renderDeveloper(root);
    expect(root.textContent || "").toContain("Developpeur");
    expect(developerSections.length).toBe(5);
    expect(root.textContent || "").toContain("Toolbox");
    expect(root.innerHTML).not.toMatch(/\\bon\\w+\\s*=/i);
  });
});
