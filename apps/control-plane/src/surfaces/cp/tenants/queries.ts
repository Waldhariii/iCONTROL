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

// Données mock pour développement
const MOCK_TENANTS: TenantRow[] = [
  {
    id: "acme-corp",
    name: "Acme Corporation",
    plan: "ENTERPRISE",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-02-01T14:30:00Z"
  },
  {
    id: "test-inc",
    name: "Test Inc",
    plan: "PRO",
    created_at: "2025-01-20T09:00:00Z",
    updated_at: "2025-01-25T16:00:00Z"
  },
  {
    id: "demo-ltd",
    name: "Demo Limited",
    plan: "FREE",
    created_at: "2025-02-01T11:00:00Z",
    updated_at: "2025-02-10T12:00:00Z"
  }
];

export function useTenantsQuery() {
  const { tenantId } = useTenantContext();
  const [data, setData] = React.useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const API_BASE = getApiBase();
    try {
      const res = await fetch(`${API_BASE}/api/tenants`, {
        headers: { "x-tenant-id": tenantId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { success: boolean; data: TenantRow[] };
      setData(json.data || []);
    } catch (err) {
      // Si l'API échoue, utiliser les données mock
      console.warn("API /api/tenants failed, using mock data:", err);
      setData(MOCK_TENANTS);
    }
  }, [tenantId]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        await refresh();
      } catch (err) {
        if (alive) {
          // Ne pas afficher d'erreur si on a des données mock
          if (data.length === 0) {
            setError(String(err));
          }
        }
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
