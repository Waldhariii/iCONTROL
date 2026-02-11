import React from "react";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { usePoliciesQuery } from "./queries";
import { usePoliciesCommands } from "./commands";
import { canAccessPolicies, canWritePolicies } from "@/runtime/rbac";
import { getSession } from "@/localAuth";

export default function PoliciesPage() {
  const { tenantId } = useTenantContext();
  const { data, isLoading, error, refresh } = usePoliciesQuery();
  const { createPolicy, updatePolicy, deletePolicy } = usePoliciesCommands();

  const [form, setForm] = React.useState({ id: "", name: "", status: "ACTIVE" });
  const [statusMap, setStatusMap] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [compact, setCompact] = React.useState<"normal" | "compact" | "dense">("normal");
  const canWrite = canAccessPolicies() && canWritePolicies();
  const prefsKey = React.useMemo(() => {
    const s = getSession();
    const user = String((s as any)?.username || (s as any)?.userId || "anonymous");
    return `icontrol:cp:policies:compact:${tenantId}:${user}`;
  }, [tenantId]);

  React.useEffect(() => {
    const next: Record<string, string> = {};
    data.forEach((row) => {
      next[row.id] = row.status;
    });
    setStatusMap(next);
  }, [data]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(prefsKey);
      if (raw === "normal" || raw === "compact" || raw === "dense") {
        setCompact(raw);
      }
    } catch {
      // ignore
    }
  }, [prefsKey]);

  React.useEffect(() => {
    try {
      localStorage.setItem(prefsKey, compact);
    } catch {
      // ignore
    }
  }, [prefsKey, compact]);

  const onCreate = async () => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setMessage(null);
    const res = await createPolicy({ ...form });
    if (res.ok) {
      setForm({ id: "", name: "", status: "ACTIVE" });
      await refresh();
      setMessage("✅ Policy créée.");
    } else {
      setMessage(`Erreur: ${res.code}`);
    }
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
    const res = await updatePolicy({
      id: row.id,
      name: row.name,
      status: statusMap[row.id] ?? row.status,
    });
    if (res.ok) {
      await refresh();
      setMessage("✅ Policy mise à jour.");
    } else {
      setMessage(`Erreur: ${res.code}`);
    }
    setBusyId(null);
  };

  const onDelete = async (rowId: string) => {
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    const ok = window.confirm("Supprimer cette policy?");
    if (!ok) return;
    setBusyId(rowId);
    setMessage(null);
    const res = await deletePolicy({ id: rowId });
    if (res.ok) {
      await refresh();
      setMessage("✅ Policy supprimée.");
    } else {
      setMessage(`Erreur: ${res.code}`);
    }
    setBusyId(null);
  };

  if (!canAccessPolicies()) {
    return (
      <div className="ic-admin-page">
        <header className="ic-admin-header">
          <h1 className="ic-admin-title">CP / POLICIES</h1>
          <p className="ic-admin-subtitle">Accès refusé.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="ic-admin-page">
      <header className="ic-admin-header">
        <h1 className="ic-admin-title">CP / POLICIES</h1>
        <p className="ic-admin-subtitle">Gouvernance et règles d’accès.</p>
      </header>

      <section className="ic-admin-meta">
        <div className="ic-admin-pill">
          <span>Tenant actif</span>
          <strong>{tenantId}</strong>
        </div>
        <div className="ic-admin-pill">
          <span>Total</span>
          <strong>{isLoading ? "…" : data.length}</strong>
        </div>
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Ajouter une policy</h2>
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
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            disabled={!canWrite}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
            <option value="EXPERIMENTAL">EXPERIMENTAL</option>
          </select>
          <button className="ic-admin-btn ic-admin-btn--primary" onClick={onCreate} disabled={!canWrite}>
            Créer
          </button>
        </div>
        {message ? <div className="ic-admin-message">{message}</div> : null}
      </section>

      <section className="ic-admin-card">
        <h2 className="ic-admin-card-title">Policies existantes</h2>
        {error ? <div className="ic-admin-alert">Erreur: {error}</div> : null}
        <div className="ic-admin-filter-actions">
          <label className="ic-admin-toggle">
            <span>Mode</span>
            <select
              className="ic-admin-select ic-admin-select--inline"
              value={compact}
              onChange={(e) => setCompact(e.target.value as "normal" | "compact" | "dense")}
            >
              <option value="normal">Normal</option>
              <option value="compact">Compact</option>
              <option value="dense">Super compact</option>
            </select>
          </label>
        </div>
        <div
          className={`ic-admin-table ic-admin-table--sticky ${
            compact === "compact"
              ? "ic-admin-table--compact"
              : compact === "dense"
                ? "ic-admin-table--dense"
                : ""
          }`}
        >
          <div className="ic-admin-row ic-admin-row--head">
            <span>ID</span>
            <span>Nom</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {isLoading ? (
            <div className="ic-admin-row">
              <span>Chargement...</span>
              <span />
              <span />
              <span />
            </div>
          ) : (
            data.map((row) => (
              <div key={row.id} className="ic-admin-row">
                <span>{row.id}</span>
                <span>{row.name}</span>
                <span>
                  <select
                    className="ic-admin-select ic-admin-select--inline"
                    value={statusMap[row.id] ?? row.status}
                    onChange={(e) => setStatusMap({ ...statusMap, [row.id]: e.target.value })}
                    disabled={!canWrite}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLED">DISABLED</option>
                    <option value="EXPERIMENTAL">EXPERIMENTAL</option>
                  </select>
                </span>
                <span className="ic-admin-actions">
                  <button
                    className="ic-admin-btn"
                    onClick={() => onUpdate(row.id)}
                    disabled={busyId === row.id || !canWrite}
                  >
                    Mettre à jour
                  </button>
                  <button
                    className="ic-admin-btn ic-admin-btn--danger"
                    onClick={() => onDelete(row.id)}
                    disabled={busyId === row.id || !canWrite}
                  >
                    Supprimer
                  </button>
                </span>
              </div>
            ))
          )}
          {!isLoading && data.length === 0 ? <div className="ic-admin-empty">Aucune policy.</div> : null}
        </div>
      </section>
    </div>
  );
}
