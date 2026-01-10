// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderBrandingSettings } from "./branding";

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

describe("settings branding page", () => {
  it("renders Identité & marque heading", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderBrandingSettings(root);
    expect(root.textContent || "").toContain("Identité & marque");
  });
});
