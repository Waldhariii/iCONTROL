import { describe, it, expect } from "vitest";
import { cacheGetOrCompute } from "../policies/cache.registry";

function pickAudit(rt: any): any {
  // Runtime-first (preferred): audit is a governance surface owned by runtime
  if (rt && rt.__cacheAudit) return rt.__cacheAudit;
  // Some runtimes nest state
  if (rt && rt.runtime && rt.runtime.__cacheAudit) return rt.runtime.__cacheAudit;
  if (rt && rt.core && rt.core.__cacheAudit) return rt.core.__cacheAudit;

  // Fallback (best-effort only): avoid forcing global leak
  const w: any = globalThis as any;
  if (w && w.__cacheAudit) return w.__cacheAudit;

  return undefined;
}

describe("cache audit snapshot (contract)", () => {
  it("exposes a stable read-only audit snapshot with required fields (best-effort)", async () => {
    const rt: any = { __now: () => Date.now() };

    // Trigger cache path to ensure audit mark is initialized
    const v = await cacheGetOrCompute(rt, "k:audit:snap", async () => 1, { ttlMs: 50 });
    expect(v).toBe(1);

    const audit = pickAudit(rt);
    expect(audit).toBeTruthy();

    // Required stable fields
    expect(typeof audit.ts).toBe("number");
    expect(typeof audit.schemaVersion).toBe("number");
    expect(typeof audit.swrDisabled).toBe("boolean");
    expect(typeof audit.metricsDisabled).toBe("boolean");

    // Snapshot helper must be JSON-safe (if present)
    if (typeof audit.snapshot === "function") {
      const snap = audit.snapshot();
      expect(snap).toBeTruthy();
      expect(typeof snap.ts).toBe("number");
      expect(typeof snap.schemaVersion).toBe("number");
      expect(typeof snap.swrDisabled).toBe("boolean");
      expect(typeof snap.metricsDisabled).toBe("boolean");
      for (const k of Object.keys(snap)) {
        expect(typeof (snap as any)[k]).not.toBe("function");
      }
    }
  });
});
