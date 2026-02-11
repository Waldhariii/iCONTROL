import { getApiBase } from "@/core/runtime/apiBase";
import { useTenantContext } from "@/core/tenant/tenantContext";
import React from "react";

export type TenantRow = {
  id: string;
  name: string;
  plan: string;
  created_at: string;
  updated_at: string;
};

export function useTenantsQuery() {
  const { tenantId } = useTenantContext();
  const [data, setData] = React.useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/api/tenants`, {
      headers: { "x-tenant-id": tenantId },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { success: boolean; data: TenantRow[] };
    setData(json.data || []);
  }, [tenantId]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        if (alive) setError(String(err));
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
