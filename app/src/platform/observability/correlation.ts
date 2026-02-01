/**
 * Correlation ID for cross-log stitching.
 * Browser-safe: uses crypto.randomUUID when available, otherwise a deterministic fallback.
 */
export function newCorrelationId(prefix = "corr"): string {
  const g: any = globalThis as any;
  if (g.crypto?.randomUUID) return `${prefix}_${g.crypto.randomUUID()}`;
  // Fallback (non-crypto) — acceptable for correlation only
  const rand = Math.random().toString(16).slice(2);
  const ts = Date.now().toString(16);
  return `${prefix}_${ts}_${rand}`;
}

declare global {
  // eslint-disable-next-line no-var
  var __ICONTROL_CORRELATION_ID__: string | undefined;
}

export function getCorrelationId(): string {
  return (globalThis as any).__ICONTROL_CORRELATION_ID__ || setCorrelationId(newCorrelationId());
}

export function setCorrelationId(id: string): string {
  (globalThis as any).__ICONTROL_CORRELATION_ID__ = id;
  return id;
}
