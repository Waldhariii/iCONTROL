// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, setSession } from "/src/localAuth";
import { renderLogsPage, logsSections } from "./index";
import { recordObs, getAuditLog, clearAuditLog } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";

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
    expect(logsSections.length).toBe(4);
    expect(root.textContent || "").toContain("Audit");
  });

  it("denies access for USER role", () => {
    setSession({ username: "user", role: "USER", issuedAt: Date.now() });
    const root = document.createElement("div");
    renderLogsPage(root);
    expect(root.textContent || "").toContain("Access denied");
  });

  it("blocks export in SAFE_MODE strict", () => {
    clearAuditLog();
    setSession({ username: "admin", role: "ADMIN", issuedAt: Date.now() });
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const root = document.createElement("div");
    renderLogsPage(root);
    const btn = root.querySelector("button[data-action-id='export_logs']") as HTMLButtonElement | null;
    btn?.click();
    const log = getAuditLog();
    expect(log.some((e) => e.code === OBS.WARN_SAFE_MODE_WRITE_BLOCKED)).toBe(true);
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  });
});
