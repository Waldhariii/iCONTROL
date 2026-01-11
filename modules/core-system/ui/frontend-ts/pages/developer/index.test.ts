// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// ICONTROL_LOCALAUTH_SHIM_V1
import { setSession, clearSession } from "../_shared/localAuth";
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

  it("DEVELOPER sees toolbox-rules after policy change (no masking)", () => {
  const root = document.createElement("div");
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  // @ts-ignore
  setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });

  // @ts-ignore
  renderDeveloper(root);

  const t = root.textContent || "";
  expect(t).toContain("Rules engine inventory");
  expect(t).not.toContain("WARN_SECTION_BLOCKED");
});

it("DEVELOPER can see toolbox-rules (RBAC section gating)", () => {
  const root = document.createElement("div");
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  // @ts-ignore
  setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });

  // NOTE: dans ce repo, le renderer exporté est renderDeveloper
  // @ts-ignore
  renderDeveloper(root);

  const t = root.textContent || "";
  // Doit afficher la section rules et ne pas être bloqué
  // Content marker must be present for DEVELOPER after RBAC change
  expect(t).toContain("Rules engine inventory");
  expect(t).not.toContain("WARN_SECTION_BLOCKED");
});

it("ADMIN is blocked from toolbox-rules (policy)", () => {
  const root = document.createElement("div");
  (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  // @ts-ignore
  setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });

  // @ts-ignore
  renderDeveloper(root);

  const t = root.textContent || "";
  // ADMIN is blocked at page-level RBAC for /developer in this policy
  expect(t).toContain("Access denied");
});

});
