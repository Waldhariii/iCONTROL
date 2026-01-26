/**
 * Minimal runtime-safe shims used by app/src/main.ts.
 * Keep surface area tiny to avoid unintended coupling.
 */
export function getGlobalWindow(): any {
  return (globalThis as any);
}

export function getImportMeta(): any {
  // Vite provides import.meta; keep fallback for non-vite contexts.
  try { return (import.meta as any); } catch { return {}; }
}
