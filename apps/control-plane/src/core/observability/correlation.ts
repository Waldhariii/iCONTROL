/**
 * SSOT correlation id generator/resolver.
 * - Import-safe: no side effects at module load.
 * - Prefer existing observability correlation if available.
 * - Fail-soft: generates corr_* when not available.
 */
function fallbackCorr(): string {
  try {
    // Prefer crypto if present
    const c: any = (globalThis as any).crypto;
    if (c?.randomUUID) return "corr_" + c.randomUUID();
  } catch { /* ignore */ }

  // Last resort
  return "corr_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export function getCorrelationIdSSOT(): string {
  try {
    const g: any = globalThis as any;

    // Common patterns:
    // - __ICONTROL_OBS__ { correlationId }
    // - __ICONTROL_RUNTIME__ { correlationId }
    const c1 = g?.__ICONTROL_OBS__?.correlationId;
    if (typeof c1 === "string" && c1.trim()) return c1;

    const c2 = g?.__ICONTROL_RUNTIME__?.correlationId;
    if (typeof c2 === "string" && c2.trim()) return c2;
  } catch {
    // ignore
  }
  return fallbackCorr();
}

/**
 * For operations needing a fresh id per request.
 */
export function newCorrelationIdSSOT(): string {
  return fallbackCorr();
}
