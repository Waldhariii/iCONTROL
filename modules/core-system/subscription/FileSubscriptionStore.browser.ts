/**
 * Browser-safe store (no filesystem access).
 * Enterprise-grade posture: client bundle must not depend on node builtins.
 *
 * NOTE:
 * - This is a deliberate "non-persistent" runtime store.
 * - Server/runtime should use FileSubscriptionStore.node.ts via dynamic import factory.
 */
export class FileSubscriptionStore {
  constructor(_baseDir?: string) {
    // Intentionally ignore baseDir in browser runtime.
  }

  async readJson<T>(_key: string, fallback: T): Promise<T> {
    return fallback;
  }

  async writeJson<T>(_key: string, _value: T): Promise<void> {
    // no-op in browser
  }
}
