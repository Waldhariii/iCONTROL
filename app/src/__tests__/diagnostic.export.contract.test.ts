import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  const w: any = globalThis as any;
  try { delete w.__ICONTROL_DIAGNOSTIC__; } catch {}
  installIControlDiagnosticDEVOnly();
});


import { installIControlDiagnosticDEVOnly } from "../dev/diagnosticInstall";
describe("diagnostic export snapshot (contract)", () => {
  it("export() returns JSON-safe snapshot with devOnly section", () => {
    const g: any = globalThis as any;
    expect(typeof g.__ICONTROL_DIAGNOSTIC__).toBe("function");
    const api = g.__ICONTROL_DIAGNOSTIC__();
    expect(typeof api.export).toBe("function");
    const snap = api.export();
    expect(typeof snap.ts).toBe("number");
    expect(snap.devOnly).toBeTruthy();
    expect(Array.isArray(snap.devOnly.cpRoutes)).toBe(true);
    expect(typeof snap.devOnly.cpRoutesCount).toBe("number");
  });
});
