// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { dashboardSections, renderDashboard } from "../dashboard";

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
});

describe("dashboard page", () => {
  it("renders sections without inline handlers", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderDashboard(root);
    expect(dashboardSections.length).toBe(5);
    expect(root.textContent || "").toContain("Dashboard");
    expect(root.textContent || "").toContain("Modules registry");
    expect(root.innerHTML).not.toMatch(/\\bon\\w+\\s*=/i);
  });
});
