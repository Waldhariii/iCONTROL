/**
 * ICONTROL_CACHE_MANAGER_V1
 * Système de caching stratégique multi-niveaux
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum entries
  strategy?: "lru" | "fifo" | "lfu"; // Cache eviction strategy
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

class CacheManager {
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();

  get<T>(cacheName: string, key: string): T | undefined {
    const cache = this.caches.get(cacheName);
    if (!cache) return undefined;

    const entry = cache.get(key);
    if (!entry) return undefined;

    // Vérifier TTL
    const now = Date.now();
    const age = now - entry.timestamp;
    const ttl = entry.ttl || Infinity;
    if (age > ttl) {
      cache.delete(key);
      return undefined;
    }

    // Mettre à jour statistiques
    entry.lastAccess = now;
    entry.accessCount++;

    return entry.value;
  }

  set<T>(cacheName: string, key: string, value: T, options: CacheOptions = {}): void {
    let cache = this.caches.get(cacheName);
    if (!cache) {
      cache = new Map();
      this.caches.set(cacheName, cache);
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
      ttl: options.ttl
    } as any;

    cache.set(key, entry);

    // Appliquer maxSize avec LRU si nécessaire
    if (options.maxSize && cache.size > options.maxSize) {
      this.evictLRU(cache);
    }
  }

  delete(cacheName: string, key: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.delete(key);
    }
  }

  clear(cacheName?: string): void {
    if (cacheName) {
      this.caches.delete(cacheName);
    } else {
      this.caches.clear();
    }
  }

  has(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    if (!cache) return false;
    
    const entry = cache.get(key);
    if (!entry) return false;

    // Vérifier TTL
    const now = Date.now();
    const age = now - entry.timestamp;
    const ttl = entry.ttl || Infinity;
    if (age > ttl) {
      cache.delete(key);
      return false;
    }

    return true;
  }

  private evictLRU(cache: Map<string, CacheEntry<any>>): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  getStats(cacheName: string): {
    size: number;
    hitRate?: number;
  } {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      return { size: 0 };
    }

    return {
      size: cache.size
    };
  }
}

export const cacheManager = new CacheManager();

// Caches prédéfinis avec configurations optimales
export const apiCache = {
  get: <T>(key: string) => cacheManager.get<T>("api", key),
  set: <T>(key: string, value: T, ttl = 60000) => cacheManager.set("api", key, value, { ttl, maxSize: 1000, strategy: "lru" }),
  delete: (key: string) => cacheManager.delete("api", key),
  clear: () => cacheManager.clear("api")
};

export const uiCache = {
  get: <T>(key: string) => cacheManager.get<T>("ui", key),
  set: <T>(key: string, value: T, ttl = 300000) => cacheManager.set("ui", key, value, { ttl, maxSize: 500, strategy: "lru" }),
  delete: (key: string) => cacheManager.delete("ui", key),
  clear: () => cacheManager.clear("ui")
};
