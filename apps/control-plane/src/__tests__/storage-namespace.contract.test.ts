// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { beforeEach, afterEach, expect, test } from "vitest";
import { setTenantId } from "../core/runtime/tenant";
import { setSafeMode } from "../core/runtime/safeMode";
import { readAuditLog, clearAuditLog, appendAuditEvent } from "../core/audit/auditLog";

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
  const mock = createLocalStorageMock();
  (globalThis as any).localStorage = mock;
  (globalThis as any).window.localStorage = mock;
});

afterEach(() => {
  setSafeMode(false);
  clearAuditLog();
});

test("audit log is namespaced by tenant", () => {
  setSafeMode(false);

  setTenantId("tenantA");
  clearAuditLog();
  appendAuditEvent({ level: "INFO", code: "INFO_TEST", scope: "test", message: "A" });
  const a = readAuditLog();
  expect(a.length).toBe(1);

  setTenantId("tenantB");
  clearAuditLog();
  const b0 = readAuditLog();
  expect(b0.length).toBe(0);
  appendAuditEvent({ level: "INFO", code: "INFO_TEST", scope: "test", message: "B" });
  const b = readAuditLog();
  expect(b.length).toBe(1);

  setTenantId("tenantA");
  const a2 = readAuditLog();
  expect(a2.length).toBe(1);
  expect(a2[0].message).toBe("A");
});

test("SAFE_MODE blocks audit writes", () => {
  setTenantId("public");
  setSafeMode(false);
  clearAuditLog();
  appendAuditEvent({ level: "WARN", code: "WARN_TEST", scope: "test" });
  expect(readAuditLog().length).toBe(1);

  setSafeMode(true);
  appendAuditEvent({ level: "WARN", code: "WARN_TEST_2", scope: "test" });
  // should not change
  expect(readAuditLog().length).toBe(1);

  // cleanup for other tests
  setSafeMode(false);
  clearAuditLog();
});
