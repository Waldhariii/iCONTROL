// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// ICONTROL_LOCALAUTH_SHIM_V1
import { clearSession, setSession } from "./localAuth";
import { renderAccount } from "../account";
import { renderUsers } from "../users";
import { renderVerification } from "../verification";

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

describe("regression wall (ui)", () => {
  it("renders core pages without inline handlers", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";

    const usersRoot = document.createElement("div");
    renderUsers(usersRoot);
    expect(usersRoot.innerHTML).not.toMatch(/\bon\w+\s*=/i);

    const accountRoot = document.createElement("div");
    renderAccount(accountRoot);
    expect(accountRoot.innerHTML).not.toMatch(/\bon\w+\s*=/i);

    const verificationRoot = document.createElement("div");
    renderVerification(verificationRoot);
    expect(verificationRoot.innerHTML).not.toMatch(/\bon\w+\s*=/i);
  });
});
