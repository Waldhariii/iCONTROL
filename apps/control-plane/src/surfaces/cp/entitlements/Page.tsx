import React from "react";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { getApiBase } from "@/core/runtime/apiBase";
import { useWriteGateway } from "@/platform/write-gateway/writeGateway";

type TenantRow = { id: string; name: string; plan: string };

type PlanTemplate = {
  plan: string;
  enabled_pages?: string[];
  enabled_modules?: string[];
  enabled_capabilities?: string[];
  limits?: Record<string, number | null>;
};


export default function EntitlementsPage() {
  const { tenantId } = useTenantContext();
  const writeGateway = useWriteGateway();
  const [tenants, setTenants] = React.useState<TenantRow[]>([]);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [planMap, setPlanMap] = React.useState<Record<string, string>>({});
  const [templates, setTemplates] = React.useState<Array<{ key: string } & PlanTemplate>>([]);

  const loadTenants = React.useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/tenants`);
      const json = (await res.json()) as { success: boolean; data?: TenantRow[] };
      if (!res.ok || !json.success) {
        setMessage("Erreur chargement tenants.");
        return;
      }
      const rows = json.data || [];
      setTenants(rows);
      const next: Record<string, string> = {};
      rows.forEach((r) => (next[r.id] = r.plan));
      setPlanMap(next);
    } catch (e) {
      setMessage(String(e));
    }
  }, []);

  React.useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/cp/plans`);
        const json = (await res.json()) as { success: boolean; data?: { templates?: Record<string, PlanTemplate> } };
        if (!res.ok || !json.success || !json.data?.templates) {
          setMessage("Erreur chargement plans.");
          return;
        }
        const t = json.data.templates;
        const next = Object.keys(t).map((k) => ({ key: k, ...(t[k] || {}) })) as Array<{ key: string } & PlanTemplate>;
        setTemplates(next);
      } catch (e) {
        setMessage(String(e));
      }
    };
    void loadTemplates();
  }, []);

  const savePlan = async (rowId: string) => {
    const row = tenants.find((t) => t.id === rowId);
    if (!row) return;
    setBusyId(rowId);
    setMessage(null);
    try {
      const res = await writeGateway.execute({
        type: "TENANT_UPDATE",
        payload: { id: row.id, name: row.name, plan: planMap[rowId] ?? row.plan },
      });
      if (!res.ok) {
        setMessage(res.reason || res.code || "Erreur mise à jour.");
      } else {
        setMessage("✅ Plan mis à jour.");
        await loadTenants();
      }
    } catch (e) {
      setMessage(String(e));
    }
    setBusyId(null);
  };

  return (
    <div className="ic-tenants-page">
      <header className="ic-tenants-header">
        <h1 className="ic-tenants-title">CP / ENTITLEMENTS</h1>
        <p className="ic-tenants-subtitle">Templates de plans + activation par tenant.</p>
      </header>

      <section className="ic-tenants-meta">
        <div className="ic-tenants-pill">
          <span>Tenant actif</span>
          <strong>{tenantId}</strong>
        </div>
        <div className="ic-tenants-pill">
          <span>Templates</span>
          <strong>{templates.length}</strong>
        </div>
      </section>

      {message && <div className="ic-admin-message">{message}</div>}

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Plans disponibles</h2>
        <div className="ic-admin-grid">
          {templates.map((tpl) => (
            <div key={tpl.key} className="ic-admin-panel">
              <h3 className="ic-admin-panel-title">{tpl.key}</h3>
              <div className="ic-admin-mini">
                <strong>Modules</strong>
                <div>{(tpl.enabled_modules || []).join(", ") || "—"}</div>
              </div>
              <div className="ic-admin-mini">
                <strong>Pages</strong>
                <div>{(tpl.enabled_pages || []).join(", ") || "—"}</div>
              </div>
              <div className="ic-admin-mini">
                <strong>Caps</strong>
                <div>{(tpl.enabled_capabilities || []).join(", ") || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Assigner un plan par tenant</h2>
        <div className="ic-admin-table">
          {tenants.map((t) => (
            <div key={t.id} className="ic-admin-row">
              <div>
                <strong>{t.name}</strong>
                <div className="ic-admin-mini">{t.id}</div>
              </div>
              <select
                className="ic-admin-input"
                value={planMap[t.id] ?? t.plan}
                onChange={(e) => setPlanMap({ ...planMap, [t.id]: e.target.value })}
              >
                {templates.map((tpl) => (
                  <option key={tpl.key} value={tpl.key}>{tpl.key}</option>
                ))}
              </select>
              <button className="btn-primary" disabled={busyId === t.id} onClick={() => savePlan(t.id)}>
                {busyId === t.id ? "…" : "Appliquer"}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
