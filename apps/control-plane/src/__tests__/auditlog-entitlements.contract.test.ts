import { beforeEach, afterEach, expect, test } from "vitest";
import { readAuditLog, clearAuditLog } from "../core/audit/auditLog";
import { requireEntitlement } from "../core/entitlements/requireEntitlement";
import { WARN_ENTITLEMENTS_MISSING_PRO } from "../core/entitlements/warnings";

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
  clearAuditLog();
});

test("missing PRO entitlement appends WARN audit event", () => {
  clearAuditLog();
  try {
    requireEntitlement("pro", { route: "/dashboard" });
  } catch {}
  const events = readAuditLog();
  expect(events.length).toBeGreaterThan(0);
  const last = events[events.length - 1];
  expect(last.level).toBe("WARN");
  expect(last.code).toBe(WARN_ENTITLEMENTS_MISSING_PRO);
  expect(last.scope).toBe("entitlements");
  expect(last.meta.route).toBe("/dashboard");
});
