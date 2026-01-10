// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderLogsPage, logsSections } from "./index";
import { recordObs } from "../_shared/audit";

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

describe("logs page", () => {
  it("renders audit log for allowed roles", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    recordObs({ code: "INFO", detail: "test" });
    const root = document.createElement("div");
    renderLogsPage(root);
    expect(logsSections.length).toBe(1);
    expect(root.textContent || "").toContain("Audit");
  });

  it("denies access for USER role", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderLogsPage(root);
    expect(root.textContent || "").toContain("Access denied");
  });
});
