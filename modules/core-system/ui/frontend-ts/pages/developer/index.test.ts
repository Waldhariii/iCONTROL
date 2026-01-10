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
    expect(developerSections.length).toBe(6);
    expect(root.textContent || "").toContain("Registry viewer");
    expect(root.textContent || "").toContain("Audit log");
    expect(root.innerHTML).not.toMatch(/\bon\w+\s*=/i);
  });

  it("blocks external datasources in SAFE_MODE strict", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const root = document.createElement("div");
    renderDeveloper(root);
    expect(root.textContent || "").toContain("blocked");
  });

  it("allows external datasources in SAFE_MODE compat", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
    const root = document.createElement("div");
    renderDeveloper(root);
    expect(root.textContent || "").toContain("allowed");
  });

  it("masks SYSADMIN-only section for DEVELOPER with warning", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
    const root = document.createElement("div");
    renderDeveloper(root);
    expect(root.textContent || "").toContain("Sections réservées");
    expect(root.textContent || "").toContain("toolbox-rules");
    expect(root.textContent || "").not.toContain("WARN_SECTION_BLOCKED");
  });

  it("denies access for non-authorized roles", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderDeveloper(root);
    expect(root.textContent || "").toContain("Access denied");
  });

  it("does not show reserved card for SYSADMIN", () => {
    setSession({ username: "admin", role: "SYSADMIN", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderDeveloper(root);
    expect(root.textContent || "").not.toContain("Sections réservées");
    expect(root.textContent || "").toContain("Rules");
  });
});
