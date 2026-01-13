/**
 * Tenant Context (v1)
 * - Default: "public" (single-tenant fallback)
 * - Future: derive from auth/session/hostname/route param
 */
const TENANT_KEY = "icontrol.runtime.tenantId.v1";

export function getTenantId(): string {
  try {
    const v = localStorage.getItem(TENANT_KEY);
    return (v && v.trim()) ? v.trim() : "public";
  } catch {
    return "public";
  }
}

/** Dev-only helper: allows manual switching in local/dev. */
export function setTenantId(id: string) {
  const v = (id || "").trim() || "public";
  localStorage.setItem(TENANT_KEY, v);
}
