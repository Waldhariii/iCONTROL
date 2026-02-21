/**
 * Simple in-memory metrics (counters + timings).
 * Pure TS, no external libs.
 * O2: debounced persist; hydrateFromSnapshot for boot.
 * O3: debounced recordMetricsExport in same callback (exporter NOOP unless enabled).
 */
import { persistMetrics } from "./metricsStore";
import type { MetricsSnapshot } from "./metricsStore";
import { recordMetricsExport } from "./exporter";

const counters: Record<string, number> = {};
const timings: Record<string, number[]> = {} as Record<string, number[]>;

const PERSIST_DEBOUNCE_MS = 300;
let persistTimeoutId: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
  try {
    if (persistTimeoutId !== null) clearTimeout(persistTimeoutId);
    persistTimeoutId = setTimeout(() => {
      persistTimeoutId = null;
      try {
        const snapshot = getMetricsSnapshot();
        persistMetrics(snapshot);
        recordMetricsExport(snapshot);
      } catch {
        // silent fallback
      }
    }, PERSIST_DEBOUNCE_MS);
  } catch {
    // silent
  }
}

/** Hydrate in-memory state from a persisted snapshot (e.g. on boot). No throw. */
export function hydrateFromSnapshot(snapshot: MetricsSnapshot): void {
  try {
    if (snapshot.counters && typeof snapshot.counters === "object") {
      for (const [k, v] of Object.entries(snapshot.counters)) {
        if (typeof v === "number") counters[k] = v;
      }
    }
    if (snapshot.timings && typeof snapshot.timings === "object") {
      for (const [k, v] of Object.entries(snapshot.timings)) {
        if (Array.isArray(v)) timings[k] = [...v];
      }
    }
  } catch {
    // silent fallback to memory
  }
}

export function increment(name: string, delta = 1): void {
  counters[name] = (counters[name] ?? 0) + delta;
  schedulePersist();
}

export function timing(name: string, durationMs: number): void {
  if (!timings[name]) timings[name] = [];
  timings[name].push(durationMs);
  schedulePersist();
}

export function getMetricsSnapshot(): { counters: Record<string, number>; timings: Record<string, number[]> } {
  return {
    counters: { ...counters },
    timings: Object.fromEntries(Object.entries(timings).map(([k, v]) => [k, [...v]])),
  };
}
