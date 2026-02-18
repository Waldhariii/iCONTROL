import React from "react";
import { useTenantsQuery } from "../queries";
import { useTenantsCommands } from "../commands";
import { canWriteTenants } from "@/runtime/rbac";
import { TenantDrawer } from "./TenantDrawer";
import styles from "./List.module.css";

export function TenantsList() {
  const { data, isLoading, error, refresh } = useTenantsQuery();
  const { createTenant } = useTenantsCommands();
  const [showModal, setShowModal] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ id: "", name: "", plan: "FREE" });
  const [message, setMessage] = React.useState<string | null>(null);
  const canWrite = canWriteTenants();

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
    setShowModal(false);
  };

  if (isLoading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (error) {
    return <div className={styles.error}>Erreur : {error}</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Liste des Tenants</h2>
        {canWrite && (
          <button type="button" onClick={() => setShowModal(true)} className={styles.btnPrimary}>
            + Créer un tenant
          </button>
        )}
      </div>

      {message && (
        <div className={message.includes("✅") ? styles.messageSuccess : styles.messageError}>
          {message}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.theadRow}>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Nom</th>
              <th className={styles.th}>Plan</th>
              <th className={styles.th}>Statut</th>
              <th className={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>Aucun tenant trouvé</td>
              </tr>
            ) : (
              data.map((tenant: any) => (
                <tr key={tenant.id} className={styles.tbodyRow}>
                  <td className={styles.td}>{tenant.id}</td>
                  <td className={styles.td}>{tenant.name}</td>
                  <td className={styles.tdMuted}>{tenant.plan || "FREE"}</td>
                  <td className={styles.td}>
                    <span className={styles.badge}>ACTIF</span>
                  </td>
                  <td className={styles.tdRight}>
                    <button
                      type="button"
                      onClick={() => setSelectedTenant(tenant.id)}
                      className={styles.btnSecondary}
                    >
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Créer un nouveau tenant</h3>
            <div className={styles.field}>
              <label className={styles.label}>ID/Slug *</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="acme-corp"
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Corporation"
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Plan initial</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className={styles.input}
              >
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>
                Annuler
              </button>
              <button
                type="button"
                onClick={onCreate}
                disabled={!form.id || !form.name}
                className={form.id && form.name ? styles.btnSubmit : `${styles.btnSubmit} ${styles.btnSubmitDisabled}`}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTenant && (
        <TenantDrawer
          tenantId={selectedTenant}
          onClose={() => setSelectedTenant(null)}
        />
      )}
    </div>
  );
}
