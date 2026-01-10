// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, it, expect } from "vitest";
import { clearAuditLog, getAuditLog } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { resetDossiers } from "../dossiers/model";

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

describe("safe mode write blocking", () => {
  it("blocks reset in SAFE_MODE strict", () => {
    (globalThis as any).localStorage = createLocalStorageMock();
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    clearAuditLog();
    const r = resetDossiers("ADMIN");
    expect(r.ok).toBe(false);
    const log = getAuditLog();
    expect(log.some((e) => e.code === OBS.WARN_SAFE_MODE_WRITE_BLOCKED)).toBe(true);
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  });
});
