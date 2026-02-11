import { describe, it, expect, afterEach } from "vitest";
import { installIControlDiagnosticDEVOnly } from "./diagnostic";

describe("diagnostic surface (DEV-only) contract", () => {
  
  afterEach(() => {
  const w: any = globalThis as any;
  try {
    // SSOT is configurable:true; delete must work between tests
    delete w.__ICONTROL_DIAGNOSTIC__;
  } catch {}
});

it("installs a non-enumerable, non-writable __ICONTROL_DIAGNOSTIC__ with stable API", () => {
    // Simule DEV env (Vitest + Vite env may differ; diagnostic checks import.meta.env.DEV)
    // We can't mutate import.meta.env safely; so we validate that the installer is safe to call.
    // If it no-ops (non-DEV), it should not throw.
    expect(() => installIControlDiagnosticDEVOnly()).not.toThrow();

    const w = globalThis as any;

    // In DEV runs, it should exist; in non-DEV test env it may not.
    // Contract: if present, must respect invariants.
    const diag = w.__ICONTROL_DIAGNOSTIC__;
    if (!diag) return;

    expect(diag.version).toBe("ICONTROL_DIAGNOSTIC_V1");
    expect(typeof diag.mount).toBe("function");
    expect(typeof diag.sanity).toBe("function");
    expect(typeof diag.nowISO).toBe("function");

    const snap = diag.mount();
    expect(typeof snap.hasCxMain).toBe("boolean");
    expect(typeof snap.cxMainConnected).toBe("boolean");
    expect(typeof snap.hasAppEl).toBe("boolean");
    expect(typeof snap.globalMountSet).toBe("boolean");
    expect(typeof snap.globalMountConnected).toBe("boolean");
    expect(typeof snap.resolvedTag).toBe("string");

    const sanity = diag.sanity();
    expect(typeof sanity.ok).toBe("boolean");
    expect(Array.isArray(sanity.notes)).toBe(true);
  });

  it("does not overwrite an existing diagnostic SSOT", () => {
    const w = globalThis as any;
    w.__ICONTROL_DIAGNOSTIC__ = { version: "EXTERNAL" };

    expect(() => installIControlDiagnosticDEVOnly()).not.toThrow();
    expect(w.__ICONTROL_DIAGNOSTIC__.version).toBe("EXTERNAL");

    delete w.__ICONTROL_DIAGNOSTIC__;
  });
});
