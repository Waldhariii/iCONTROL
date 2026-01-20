// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { beforeEach, afterEach, expect, test } from "vitest";
import { setSafeMode } from "../core/runtime/safeMode";
import { setTenantId } from "../core/runtime/tenant";
import { clearAuditLog, readAuditLog } from "../core/audit/auditLog";
import { requireEntitlement } from "../core/access/requireAccess";

// Best-effort: if getEntitlements falls back to __ICONTROL_ENTITLEMENTS__
declare const globalThis: any;

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

test("requireEntitlement emits audit WARN when entitlement missing", () => {
  setTenantId("public");
  setSafeMode(false);
  clearAuditLog();

  // force “no entitlements”
  globalThis.__ICONTROL_ENTITLEMENTS__ = [];

  const d = requireEntitlement("recommendations.pro", { page: "/dashboard", action: "view", scope: "ui" });
  expect(d.ok).toBe(false);

  const events = readAuditLog();
  expect(events.length).toBe(1);
  const event = events[0];
  expect(event).toBeDefined();
  if (event) {
    expect(event.level).toBe("WARN");
    expect(event.code).toBe("WARN_ACCESS_DENIED_ENTITLEMENT");
    if (event.meta) {
      expect(event.meta.entitlement).toBe("recommendations.pro");
      expect(event.meta.page).toBe("/dashboard");
    }
  }
});

test("requireEntitlement ok=true when entitlement present", () => {
  setTenantId("public");
  setSafeMode(false);
  clearAuditLog();

  globalThis.__ICONTROL_ENTITLEMENTS__ = ["recommendations.pro"];

  const d = requireEntitlement("recommendations.pro", { page: "/dashboard", action: "view", scope: "ui" });
  expect(d.ok).toBe(true);

  const events = readAuditLog();
  expect(events.length).toBe(0);
});
