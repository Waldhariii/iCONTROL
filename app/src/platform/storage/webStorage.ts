/**
 * Canonical web storage adapter (browser + test safe).
 */

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const memory = new Map<string, string>();

function resolveStorage(): StorageLike {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Fall back to in-memory storage in non-browser contexts.
  }

  return {
    getItem(key: string) {
      return memory.has(key) ? memory.get(key)! : null;
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
    removeItem(key: string) {
      memory.delete(key);
    },
  };
}

export function asStorage(): StorageLike {
  return resolveStorage();
}

export const webStorage = {
  get(key: string): string | null {
    return asStorage().getItem(key);
  },
  set(key: string, value: string): void {
    asStorage().setItem(key, value);
  },
  del(key: string): void {
    asStorage().removeItem(key);
  },
} as const;
