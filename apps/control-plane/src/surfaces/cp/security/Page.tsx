import React from "react";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { useSecurityQuery } from "./queries";
import { useSecurityCommands } from "./commands";
import { canAccessSecurity, canWriteSecurity } from "@/runtime/rbac";
import { getSession } from "@/localAuth";

export default function SecurityPage() {
  const { tenantId } = useTenantContext();
  const { data, isLoading, error, refresh } = useSecurityQuery();
  const { updateSecurity, deleteSecurity } = useSecurityCommands();

  const [statusMap, setStatusMap] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [compact, setCompact] = React.useState<"normal" | "compact" | "dense">("normal");
  const canWrite = canAccessSecurity() && canWriteSecurity();
  const prefsKey = React.useMemo(() => {
    const s = getSession();
    const user = String((s as any)?.username || (s as any)?.userId || "anonymous");
    return `icontrol:cp:security:compact:${tenantId}:${user}`;
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

  const onUpdate = async (rowId: string) => {
    const row = data.find((r) => r.id === rowId);
    if (!row) return;
    if (!canWrite) {
      setMessage("Accès refusé.");
      return;
    }
    setBusyId(rowId);
    setMessage(null);
    const res = await updateSecurity({
      id: row.id,
      name: row.name,
      status: statusMap[row.id] ?? row.status,
    });
    if (res.ok) {
      await refresh();
      setMessage("✅ Sécurité mise à jour.");
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
    const ok = window.confirm("Supprimer cette règle de sécurité?");
    if (!ok) return;
    setBusyId(rowId);
    setMessage(null);
    const res = await deleteSecurity({ id: rowId });
    if (res.ok) {
      await refresh();
      setMessage("✅ Sécurité supprimée.");
    } else {
      setMessage(`Erreur: ${res.code}`);
    }
    setBusyId(null);
  };

  if (!canAccessSecurity()) {
    return (
      <div className="ic-admin-page">
        <header className="ic-admin-header">
          <h1 className="ic-admin-title">CP / SECURITY</h1>
          <p className="ic-admin-subtitle">Accès refusé.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="ic-admin-page">
      <header className="ic-admin-header">
        <h1 className="ic-admin-title">CP / SECURITY</h1>
        <p className="ic-admin-subtitle">Règles de sécurité globales du fabricant.</p>
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
        <h2 className="ic-admin-card-title">Sécurité globale</h2>
        {message ? <div className="ic-admin-message">{message}</div> : null}
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
            <span>Action</span>
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
                    <option value="ENFORCED">ENFORCED</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="DISABLED">DISABLED</option>
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
          {!isLoading && data.length === 0 ? <div className="ic-admin-empty">Aucune règle.</div> : null}
        </div>
      </section>
    </div>
  );
}
