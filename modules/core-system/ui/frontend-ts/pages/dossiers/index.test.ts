// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "../_shared/localAuth";
import { renderDossiersPage, dossiersSections } from "./index";
import { getAuditLog, clearAuditLog } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { transitionDossier, createDossier, listDossiers } from "./model";

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
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
    expect(dossiersSections.length).toBe(10);
    expect(root.textContent || "").toContain("Dossiers");
  });

  it("create button disabled in SAFE_MODE strict", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const root = document.createElement("div");
    renderDossiersPage(root);
    const btn = root.querySelector(
      "#dossier_create_btn",
    ) as HTMLButtonElement | null;
    expect(btn?.disabled).toBe(true);
  });

  it("create allowed in COMPAT for ADMIN", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
    const root = document.createElement("div");
    renderDossiersPage(root);
    const btn = root.querySelector(
      "#dossier_create_btn",
    ) as HTMLButtonElement | null;
    expect(btn?.disabled).toBe(false);
  });

  it("USER cannot access", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderDossiersPage(root);
    expect(root.textContent || "").toContain("Access denied");
  });

  it("state transition blocked when CLOSED", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    const res = createDossier("ADMIN", {
      title: "Test",
      kind: "INTERVENTION",
      state: "OPEN",
      owner: "ADMIN",
    });
    if (!res.ok) throw new Error("create_failed");
    transitionDossier("ADMIN", res.dossier.id, "CLOSED");
    const r = transitionDossier("ADMIN", res.dossier.id, "OPEN");
    expect(r.ok).toBe(false);
  });

  it("STRICT blocks transition and create", () => {
    clearAuditLog();
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
    const seed = createDossier("ADMIN", {
      title: "Seed",
      kind: "INTERVENTION",
      state: "OPEN",
      owner: "ADMIN",
    });
    if (!seed.ok) throw new Error("seed_failed");
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const res = createDossier("ADMIN", {
      title: "Strict",
      kind: "INTERVENTION",
      state: "OPEN",
      owner: "ADMIN",
    });
    expect(res.ok).toBe(false);
    const tr = transitionDossier("ADMIN", seed.dossier.id, "IN_PROGRESS");
    expect(tr.ok).toBe(false);
    const log = getAuditLog();
    expect(log.some((e) => e.code === OBS.WARN_SAFE_MODE_WRITE_BLOCKED)).toBe(
      true,
    );
  });

  it("COMPAT allows transition for ADMIN", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
    const res = createDossier("ADMIN", {
      title: "Compat",
      kind: "INTERVENTION",
      state: "OPEN",
      owner: "ADMIN",
    });
    if (!res.ok) throw new Error("create_failed");
    const r = transitionDossier("ADMIN", res.dossier.id, "IN_PROGRESS");
    expect(r.ok).toBe(true);
  });

  it("history entry appended on transition", () => {
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
    const res = createDossier("ADMIN", {
      title: "Hist",
      kind: "INTERVENTION",
      state: "OPEN",
      owner: "ADMIN",
    });
    if (!res.ok) throw new Error("create_failed");
    transitionDossier("ADMIN", res.dossier.id, "WAITING");
    const rows = listDossiers();
    const found = rows.find((d) => d.id === res.dossier.id);
    expect((found?.history || []).length).toBeGreaterThan(0);
  });

  it("export blocked in STRICT via actionbar", () => {
    clearAuditLog();
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const root = document.createElement("div");
    renderDossiersPage(root);
    const btn = root.querySelector(
      "button[data-action-id='export_csv']",
    ) as HTMLButtonElement | null;
    btn?.click();
    const log = getAuditLog();
    expect(log.some((e) => e.code === OBS.WARN_SAFE_MODE_WRITE_BLOCKED)).toBe(
      true,
    );
  });
});
