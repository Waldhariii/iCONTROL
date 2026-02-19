/**
 * Users commands — save RBAC via write gateway / API. No inline write gateway in Page.
 */

import { getApiBase } from "@/core/runtime/apiBase";
import { getSession } from "@/localAuth";
import { getTenantId } from "@/core/runtime/tenant";
import type { RbacRoles } from "./useUsersQueries";
// saveRbac persists via API; Page uses this instead of inline write gateway

function getAuthHeaders(): Record<string, string> {
  const s = getSession();
  return {
    "Content-Type": "application/json",
    "x-user-role": String((s as any)?.role || "USER").toUpperCase(),
    "x-user-id": String((s as any)?.username || ""),
    "x-tenant-id": String(getTenantId?.() ?? (globalThis as any).__ICONTROL_RUNTIME__?.tenantId ?? "default"),
  };
}

export function useUsersCommands() {
  const saveRbac = async (roles: RbacRoles): Promise<boolean> => {
    const res = await fetch(`${getApiBase()}/api/cp/rbac`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ roles }),
    });
    return res.ok;
  };

  return { saveRbac };
}
