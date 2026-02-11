import { describe, it, expect } from "vitest";
import { incCounter, setGauge, observeHistogram, snapshotMetrics, flushMetrics } from "../policies/metrics.registry";

describe("metrics — registry (contract)", () => {
  it("records counters/gauges/histograms and snapshots are stable", () => {
    const rt: any = {};
    incCounter(rt, "a.count", 1, { k: "v" });
    setGauge(rt, "a.gauge", 42);
    observeHistogram(rt, "a.lat", 10);
    observeHistogram(rt, "a.lat", 30);

    const snap = snapshotMetrics(rt);
    expect(Object.keys(snap.counters).length).toBeGreaterThan(0);
    expect(Object.keys(snap.gauges).length).toBeGreaterThan(0);
    expect(Object.keys(snap.histograms).length).toBeGreaterThan(0);

    const h = Object.values(snap.histograms)[0] as any;
    expect(h.count).toBe(2);
    expect(h.min).toBe(10);
    expect(h.max).toBe(30);
  });

  it("flush resets store but returns last snapshot", () => {
    const rt: any = {};
    incCounter(rt, "x", 2);
    const before = flushMetrics(rt);
    expect(before.counters["x"]).toBe(2);

    const after = snapshotMetrics(rt);
    expect(Object.keys(after.counters).length).toBe(0);
  });
});
