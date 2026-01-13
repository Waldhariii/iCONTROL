import { describe, it, expect, vi } from "vitest";
import { emitAudit } from "../policies/audit.emit";
import { AUDIT_SCOPES } from "../policies/audit.scopes";
import { snapshotMetrics } from "../policies/metrics.registry";

describe("audit — metrics integration (contract)", () => {
  it("increments audit.emit.count and observes audit.emit.latency_ms", () => {
    const emit = vi.fn();
    const rt: any = { audit: { emit } };

    emitAudit(rt, "WARN", "WARN_X", "msg", { scope: AUDIT_SCOPES.CONTROL_PLANE, source: "control_plane", data: { k: 1 } });

    const snap = snapshotMetrics(rt);
    const hasCount = Object.keys(snap.counters).some(k => k.startsWith("audit.emit.count"));
    const hasLat = Object.keys(snap.histograms).some(k => k.startsWith("audit.emit.latency_ms"));
    expect(hasCount).toBe(true);
    expect(hasLat).toBe(true);
  });
});
