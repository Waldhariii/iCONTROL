// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderDossiersPage, dossiersSections } from "./index";
import { setDossierState, createDossier } from "./model";

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

describe("dossiers page", () => {
  it("renders list table", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderDossiersPage(root);
    expect(dossiersSections.length).toBe(5);
    expect(root.textContent || "").toContain("Dossiers");
  });

  it("create button disabled in SAFE_MODE strict", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const root = document.createElement("div");
    renderDossiersPage(root);
    const btn = root.querySelector("#dossier_create_btn") as HTMLButtonElement | null;
    expect(btn?.disabled).toBe(true);
  });

  it("create allowed in COMPAT for DEVELOPER", () => {
    setSession({ username: "dev", role: "DEVELOPER", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
    const root = document.createElement("div");
    renderDossiersPage(root);
    const btn = root.querySelector("#dossier_create_btn") as HTMLButtonElement | null;
    expect(btn?.disabled).toBe(false);
  });

  it("USER cannot create", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderDossiersPage(root);
    const btn = root.querySelector("#dossier_create_btn") as HTMLButtonElement | null;
    expect(btn?.disabled).toBe(true);
  });

  it("state transition blocked when CLOSED", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    const res = createDossier("ADMIN", {
      title: "Test",
      kind: "INTERVENTION",
      state: "OPEN",
      owner: "ADMIN"
    });
    if (!res.ok) throw new Error("create_failed");
    setDossierState("ADMIN", res.dossier.id, "CLOSED");
    const r = setDossierState("ADMIN", res.dossier.id, "OPEN");
    expect(r.ok).toBe(false);
  });
});
