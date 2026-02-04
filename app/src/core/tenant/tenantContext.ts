/**
 * SSOT tenant context resolver.
 * - Import-safe: no side effects at module load.
 * - Fail-soft: returns "default" when runtime context not available.
 */
export function getTenantIdSSOT(): string {
  try {
    // Prefer runtime tenant hydration if present (best-effort, optional dependency).
    // Keep this purely defensive: no hard imports of heavy runtime modules.
    const g: any = globalThis as any;

    // Common patterns:
    // - __ICONTROL_TENANT__ { tenantId }
    // - __ICONTROL_RUNTIME__ { tenantId }
    // - location hash/query parsing (avoid here; routing owns that)
    const t1 = g?.__ICONTROL_TENANT__?.tenantId;
    if (typeof t1 === "string" && t1.trim()) return t1;

    const t2 = g?.__ICONTROL_RUNTIME__?.tenantId;
    if (typeof t2 === "string" && t2.trim()) return t2;

    const t3 = g?.__ICONTROL_RUNTIME__?.tenantIdResolved;
    if (typeof t3 === "string" && t3.trim()) return t3;
  } catch {
    // ignore
  }
  return "default";
}
