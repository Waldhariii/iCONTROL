import React from "react";
import { useTenantsQuery } from "./queries";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { useTenantsCommands } from "./commands";
import { canAccessTenants, canWriteTenants } from "@/runtime/rbac";

export default function TenantsPage() {
  const { tenantId } = useTenantContext();
  const { data, isLoading, error, refresh } = useTenantsQuery();
  const { createTenant, updateTenant, deleteTenant } = useTenantsCommands();
  const [form, setForm] = React.useState({ id: "", name: "", plan: "FREE" });
  const [planMap, setPlanMap] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const canWrite = canAccessTenants() && canWriteTenants();

  React.useEffect(() => {
    const next: Record<string, string> = {};
    data.forEach((row) => {
      next[row.id] = row.plan;
    });
    setPlanMap(next);
  }, [data]);

  const onCreate = async () => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setMessage(null);
    await createTenant({ ...form });
    setForm({ id: "", name: "", plan: "FREE" });
    await refresh();
    setMessage("✅ Tenant créé.");
  };

  const onUpdate = async (rowId: string) => {
    const row = data.find((r) => r.id === rowId);
    if (!row) return;
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setBusyId(rowId);
    setMessage(null);
    const res = await updateTenant({
      id: row.id,
      name: row.name,
      plan: planMap[row.id] ?? row.plan,
    });
    if (!res.ok) {
      setMessage(`Erreur: ${res.code}`);
    } else {
      await refresh();
      setMessage("✅ Tenant mis à jour.");
    }
    setBusyId(null);
  };

  const onDelete = async (rowId: string) => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    const ok = window.confirm("Supprimer ce tenant?");
    if (!ok) return;
    setBusyId(rowId);
    setMessage(null);
    const res = await deleteTenant({ id: rowId });
    if (!res.ok) {
      setMessage(`Erreur: ${res.code}`);
    } else {
      await refresh();
      setMessage("✅ Tenant supprimé.");
    }
    setBusyId(null);
  };

  if (!canAccessTenants()) {
    return (
      <div className="ic-tenants-page">
        <header className="ic-tenants-header">
          <h1 className="ic-tenants-title">CP / TENANTS</h1>
          <p className="ic-tenants-subtitle">Accès refusé.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="ic-tenants-page">
      <header className="ic-tenants-header">
        <h1 className="ic-tenants-title">CP / TENANTS</h1>
        <p className="ic-tenants-subtitle">
          Liste des tenants gouvernés. Lecture seule pour l’instant.
        </p>
      </header>

      <section className="ic-tenants-meta">
        <div className="ic-tenants-pill">
          <span>Tenant actif</span>
          <strong>{tenantId}</strong>
        </div>
        <div className="ic-tenants-pill">
          <span>Total</span>
          <strong>{isLoading ? "…" : data.length}</strong>
        </div>
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Ajouter un tenant</h2>
        <div className="ic-admin-form">
          <input
            className="ic-admin-input"
            placeholder="ID (optionnel)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <input
            className="ic-admin-input"
            placeholder="Nom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="ic-admin-select"
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            disabled={!canWrite}
          >
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <button className="ic-admin-btn ic-admin-btn--primary" onClick={onCreate} disabled={!canWrite}>
            Créer
          </button>
        </div>
        {message ? <div className="ic-admin-message">{message}</div> : null}
      </section>

      {error ? <div className="ic-tenants-alert">Erreur: {error}</div> : null}

      <div className="ic-tenants-table">
        <div className="ic-tenants-row ic-tenants-row--head">
          <span>ID</span>
          <span>Nom</span>
          <span>Plan</span>
          <span>Créé</span>
          <span>Maj</span>
          <span>Actions</span>
        </div>
        {isLoading ? (
          <div className="ic-tenants-row">
            <span>Chargement...</span>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : (
          data.map((tenant) => (
            <div key={tenant.id} className="ic-tenants-row">
              <span>{tenant.id}</span>
              <span>{tenant.name}</span>
              <span>
                <select
                  className="ic-admin-select ic-admin-select--inline"
                  value={planMap[tenant.id] ?? tenant.plan}
                  onChange={(e) => setPlanMap({ ...planMap, [tenant.id]: e.target.value })}
                  disabled={!canWrite}
                >
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </span>
              <span>{tenant.created_at}</span>
              <span>{tenant.updated_at}</span>
              <span className="ic-admin-actions">
                  <button
                    className="ic-admin-btn"
                    onClick={() => onUpdate(tenant.id)}
                    disabled={busyId === tenant.id || !canWrite}
                  >
                    Mettre à jour
                  </button>
                  <button
                    className="ic-admin-btn ic-admin-btn--danger"
                    onClick={() => onDelete(tenant.id)}
                    disabled={busyId === tenant.id || !canWrite}
                  >
                    Supprimer
                  </button>
              </span>
            </div>
          ))
        )}
        {!isLoading && data.length === 0 ? (
          <div className="ic-tenants-empty">Aucun tenant trouvé.</div>
        ) : null}
      </div>
    </div>
  );
}
