import { getApiBase } from "@/core/runtime/apiBase";
import { useTenantContext } from "@/core/tenant/tenantContext";
import React from "react";

export type ProviderRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  config_json?: string;
  health_status?: string;
  fallback_provider_id?: string | null;
  updated_at: string;
};

export type ProviderMetrics = {
  labels: string[];
  series: Record<string, number[]>;
};

export function useProvidersQuery(days: number) {
  const { tenantId } = useTenantContext();
  const [data, setData] = React.useState<ProviderRow[]>([]);
  const [metrics, setMetrics] = React.useState<ProviderMetrics>({ labels: [], series: {} });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const API_BASE = getApiBase();
    const res = await fetch(`${API_BASE}/api/cp/providers`, {
      headers: { "x-tenant-id": tenantId },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { success: boolean; data: ProviderRow[] };
    setData(json.data || []);

    const metricsRes = await fetch(`${API_BASE}/api/cp/providers/metrics?days=${days}`, {
      headers: { "x-tenant-id": tenantId },
    });
    if (metricsRes.ok) {
      const metricsJson = (await metricsRes.json()) as { success: boolean; data: ProviderMetrics };
      if (metricsJson?.data) setMetrics(metricsJson.data);
    }
  }, [tenantId, days]);

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

  return { data, metrics, isLoading, error, refresh };
}
