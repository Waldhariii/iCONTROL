// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "../localAuth";
import { getRouteId } from "../router";
import { renderToolbox } from "../../../modules/core-system/ui/frontend-ts/pages/toolbox";

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
  (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
  document.body.innerHTML = `<div id="app"></div>`;
});

afterEach(() => {
  clearSession();
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
});

describe("router toolbox route", () => {
  it("maps #/toolbox -> toolbox", () => {
    window.location.hash = "#/toolbox";
    expect(getRouteId()).toBe("toolbox");
  });
});

describe("toolbox page", () => {
  it("denies access for non-privileged roles", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    const root = document.getElementById("app") as HTMLElement;
    renderToolbox(root);
    expect(root.textContent || "").toContain("Access denied.");
  });

  it("renders sections without inline handlers", () => {
    setSession({ username: "admin", role: "SYSADMIN", issuedAt: Date.now() });
    const root = document.getElementById("app") as HTMLElement;
    renderToolbox(root);
    const sections = root.querySelectorAll("section[data-toolbox-section]");
    expect(sections.length).toBe(6);
    expect(root.innerHTML).not.toMatch(/\\bon\\w+\\s*=/i);
    expect(root.innerHTML).not.toMatch(/<\\s*script\\b/i);
  });
});
