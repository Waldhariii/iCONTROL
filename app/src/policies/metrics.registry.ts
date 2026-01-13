type AnyRt = any;

export type MetricPoint = {
  ts: string;
  name: string;
  value: number;
  tags?: Record<string, string>;
};

export type MetricsSnapshot = {
  ts: string;
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, { count: number; sum: number; min: number; max: number }>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function keyOf(name: string, tags?: Record<string, string>): string {
  if (!tags) return name;
  const parts = Object.keys(tags).sort().map(k => `${k}=${tags[k]}`);
  return parts.length ? `${name}|${parts.join(",")}` : name;
}

function ensureStore(rt: AnyRt) {
  if (!rt) return null;
  if (!rt.__METRICS__) {
    rt.__METRICS__ = {
      counters: Object.create(null),
      gauges: Object.create(null),
      histograms: Object.create(null),
      lastFlushTs: null as string | null,
    };
  }
  return rt.__METRICS__;
}

export function incCounter(rt: AnyRt, name: string, delta = 1, tags?: Record<string, string>): void {
  try {
    const w: any = (arguments as any)?.[0] || {};
    if (w.__METRICS_DISABLED__) return;
  } catch {}

  try {
    const st = ensureStore(rt);
    if (!st) return;
    const k = keyOf(name, tags);
    st.counters[k] = (st.counters[k] || 0) + delta;
  } catch {}
}

export function setGauge(rt: AnyRt, name: string, value: number, tags?: Record<string, string>): void {
  try {
    const st = ensureStore(rt);
    if (!st) return;
    const k = keyOf(name, tags);
    st.gauges[k] = value;
  } catch {}
}

export function observeHistogram(rt: AnyRt, name: string, value: number, tags?: Record<string, string>): void {
  try {
    const w: any = (arguments as any)?.[0] || {};
    if (w.__METRICS_DISABLED__) return;
  } catch {}

  try {
    const st = ensureStore(rt);
    if (!st) return;
    const k = keyOf(name, tags);
    const h = st.histograms[k] || { count: 0, sum: 0, min: value, max: value };
    h.count += 1;
    h.sum += value;
    h.min = Math.min(h.min, value);
    h.max = Math.max(h.max, value);
    st.histograms[k] = h;
  } catch {}
}

export function snapshotMetrics(rt: AnyRt): MetricsSnapshot {
  const ts = nowIso();
  try {
    const st = ensureStore(rt);
    if (!st) {

  try {
    const w: any = (arguments as any)?.[0] || {};
    if (w.__METRICS_DISABLED__) return;
  } catch {}try {
    const w: any = (arguments as any)?.[0] || {};
    if (w.__METRICS_DISABLED__) return;
  } catch {}return { ts, counters: {}, gauges: {}, histograms: {} };
    }
    return {
      ts,
      counters: { ...st.counters },
      gauges: { ...st.gauges },
      histograms: { ...st.histograms },
    };
  } catch {
    return { ts, counters: {}, gauges: {}, histograms: {} };
  }
}

export function flushMetrics(rt: AnyRt): MetricsSnapshot {
  const snap = snapshotMetrics(rt);
  try {
    const st = ensureStore(rt);
    if (!st) return snap;
    st.counters = Object.create(null);
    st.gauges = Object.create(null);
    st.histograms = Object.create(null);
    st.lastFlushTs = snap.ts;
  } catch {}
  return snap;
}
