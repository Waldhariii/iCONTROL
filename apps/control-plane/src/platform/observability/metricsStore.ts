/**
 * O2 Metrics Persistence — localStorage (DEV) or IndexedDB (prod).
 * No throw. Silent fallback to memory on failure.
 */

export type MetricsSnapshot = {
  counters: Record<string, number>;
  timings: Record<string, number[]>;
};

const DB_NAME = "icontrol-observability";
const STORE_NAME = "metrics";
const KEY = "latest";

function isDev(): boolean {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true) return true;
  } catch {}
  return false;
}

/** DEV → localStorage; else → IndexedDB. No throw. */
export function persistMetrics(snapshot: MetricsSnapshot): void {
  try {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify(snapshot);
    if (isDev()) {
      localStorage.setItem(`icontrol_observability_${KEY}`, payload);
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => {};
    req.onsuccess = () => {
      try {
        const db = req.result;
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({ snapshot: payload }, KEY);
        db.close();
      } catch {
        try { req.result?.close(); } catch {}
      }
    };
    req.onupgradeneeded = () => {
      try {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      } catch {}
    };
  } catch {
    // silent fallback to memory
  }
}

/** DEV → localStorage (sync); else → use loadMetricsAsync(). No throw. */
export function loadMetrics(): MetricsSnapshot | null {
  try {
    if (typeof window === "undefined") return null;
    if (!isDev()) return null;
    const raw = localStorage.getItem(`icontrol_observability_${KEY}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetricsSnapshot;
    if (parsed && typeof parsed === "object" && typeof parsed.counters === "object" && typeof parsed.timings === "object") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** Load persisted metrics (async for IndexedDB). No throw. Use in main for hydration. */
export function loadMetricsAsync(): Promise<MetricsSnapshot | null> {
  try {
    if (typeof window === "undefined") return Promise.resolve(null);
    if (isDev()) return Promise.resolve(loadMetrics());
    return new Promise<MetricsSnapshot | null>((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onerror = () => resolve(null);
        req.onsuccess = () => {
          try {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.close();
              return resolve(null);
            }
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const getReq = store.get(KEY);
            getReq.onerror = () => { db.close(); resolve(null); };
            getReq.onsuccess = () => {
              try {
                const row = getReq.result as { snapshot?: string } | undefined;
                db.close();
                if (!row?.snapshot) return resolve(null);
                const parsed = JSON.parse(row.snapshot) as MetricsSnapshot;
                if (parsed && typeof parsed.counters === "object" && typeof parsed.timings === "object") {
                  return resolve(parsed);
                }
                resolve(null);
              } catch {
                resolve(null);
              }
            };
          } catch {
            resolve(null);
          }
        };
      } catch {
        resolve(null);
      }
    });
  } catch {
    return Promise.resolve(null);
  }
}

/** Clear persisted metrics. No throw. */
export function clearMetrics(): void {
  try {
    if (typeof window === "undefined") return;
    if (isDev()) {
      localStorage.removeItem(`icontrol_observability_${KEY}`);
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => {};
    req.onsuccess = () => {
      try {
        const db = req.result;
        if (db.objectStoreNames.contains(STORE_NAME)) {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).delete(KEY);
        }
        db.close();
      } catch {
        try { req.result?.close(); } catch {}
      }
    };
  } catch {
    // silent
  }
}
