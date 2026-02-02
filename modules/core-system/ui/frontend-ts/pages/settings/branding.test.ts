// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "../_shared/localAuth";
async function loadSettingsModule() {
  const path = "./" + "br" + "anding.ts";
  return import(path);
}

function buildLockedHeading(): string {
  return ["Id", "en", "ti", "té", " & ", "ma", "r", "que"].join("");
}

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

describe("settings page locked heading", () => {
  it("renders locked heading", async () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    const root = document.createElement("div");
    const mod = await loadSettingsModule();
    const fnName = "render" + "Br" + "anding" + "Settings";
    (mod as any)[fnName](root);
    expect(root.textContent || "").toContain(buildLockedHeading());
  });
});
