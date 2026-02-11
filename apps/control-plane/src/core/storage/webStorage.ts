/**
 * Canonical Web Storage adapter (SSR-safe).
 * Single implementation used by app, modules, platform-services.
 */
function safe(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined") return (globalThis as any).localStorage ?? null;
  return null;
}

function safeSession(): Storage | null {
  if (typeof window !== "undefined" && window.sessionStorage) return window.sessionStorage;
  if (typeof globalThis !== "undefined") return (globalThis as any).sessionStorage ?? null;
  return null;
}

export const webStorage = {
  get(key: string): string | null {
    const s = safe();
    return s ? s.getItem(key) : null;
  },
  set(key: string, value: string): void {
    const s = safe();
    if (s) s.setItem(key, value);
  },
  del(key: string): void {
    const s = safe();
    if (s) s.removeItem(key);
  },
  getSession(key: string): string | null {
    const s = safeSession();
    return s ? s.getItem(key) : null;
  },
  setSession(key: string, value: string): void {
    const s = safeSession();
    if (s) s.setItem(key, value);
  },
  delSession(key: string): void {
    const s = safeSession();
    if (s) s.removeItem(key);
  },
};

/** Storage-compatible adapter for functions that accept Storage. */
export function asStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear"> {
  return {
    getItem: (k) => webStorage.get(k),
    setItem: (k, v) => webStorage.set(k, v ?? ""),
    removeItem: (k) => webStorage.del(k),
    clear: () => {
      const s = safe();
      if (s) s.clear();
    },
  };
}
