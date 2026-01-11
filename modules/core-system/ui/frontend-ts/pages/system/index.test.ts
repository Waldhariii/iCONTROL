// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderSystemPage, systemSections } from "./index";

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

describe("system page", () => {
  it("renders sections for allowed roles", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderSystemPage(root);
    expect(systemSections.length).toBe(5);
    expect(root.textContent || "").toContain("SAFE_MODE");
  });

  it("denies access for USER role", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderSystemPage(root);
    expect(root.textContent || "").toContain("Access denied");
  });

  it("STRICT hides write actions", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const root = document.createElement("div");
    renderSystemPage(root);
    const btn = root.querySelector("button[data-action-id='flags_enable_all']") as HTMLButtonElement | null;
    expect(btn?.style.display).toBe("none");
  });
});
