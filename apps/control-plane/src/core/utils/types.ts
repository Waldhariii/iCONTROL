/**
 * Minimal runtime-safe shims used by apps/control-plane/src/main.ts.
 * Keep surface area tiny to avoid unintended coupling.
 */
export function getGlobalWindow(): any {
  return (globalThis as any);
}

export function getImportMeta(): any {
  // Vite provides import.meta; keep fallback for non-vite contexts.
  try { return (import.meta as any); } catch { return {}; }
}

export type UnknownRecord = Record<string, unknown>;
