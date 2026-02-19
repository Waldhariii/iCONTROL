import React from "react";
import { getApiBase } from "@/core/runtime/apiBase";
import { getSession } from "@/localAuth";

export type RbacRoles = Record<string, string[]>;

function getAuthHeaders(): Record<string, string> {
  const s = getSession();
  return {
    "Content-Type": "application/json",
    "x-user-role": String((s as any)?.role || "USER").toUpperCase(),
    "x-user-id": String((s as any)?.username ?? ""),
    "x-tenant-id": String((globalThis as any).__ICONTROL_RUNTIME__?.tenantId ?? "default"),
  };
}

export function useUsersQueries() {
  const [rbac, setRbac] = React.useState<RbacRoles>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRbac = React.useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/cp/rbac`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const json = (await res.json()) as { success: boolean; data?: { roles?: RbacRoles } };
      if (json.success && json.data?.roles) setRbac(json.data.roles);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRbac();
  }, [fetchRbac]);

  return { rbac, setRbac, loading, error, refreshRbac: fetchRbac, session: getSession() };
}
