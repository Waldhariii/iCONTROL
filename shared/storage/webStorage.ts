/**
 * Canonical Web Storage adapter (SSR-safe).
 * Single implementation used by app, modules, platform-services.
 */
function safe(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function safeSession(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
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
