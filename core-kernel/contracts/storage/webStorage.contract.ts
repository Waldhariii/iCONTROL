export interface KVStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  del(key: string): void;
}

export interface NamespacedStorage {
  withNamespace(ns: string): KVStorage;
}
