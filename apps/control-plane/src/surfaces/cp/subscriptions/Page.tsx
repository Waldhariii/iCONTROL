import React from "react";
import styles from "./SubscriptionsPage.module.css";

const MOCK_SUBSCRIPTIONS = [
  { id: "sub_001", tenantId: "acme-corp", tenantName: "Acme Corporation", plan: "ENTERPRISE", status: "active", provider: "stripe", amount: 99, currency: "USD", interval: "month", currentPeriodStart: "2026-01-13T00:00:00Z", currentPeriodEnd: "2026-02-13T00:00:00Z", cancelAtPeriodEnd: false, createdAt: "2025-12-13T00:00:00Z" },
  { id: "sub_002", tenantId: "test-inc", tenantName: "Test Inc", plan: "PRO", status: "active", provider: "paypal", amount: 29, currency: "USD", interval: "month", currentPeriodStart: "2026-01-20T00:00:00Z", currentPeriodEnd: "2026-02-20T00:00:00Z", cancelAtPeriodEnd: false, createdAt: "2026-01-20T00:00:00Z" },
  { id: "sub_003", tenantId: "demo-ltd", tenantName: "Demo Limited", plan: "PRO", status: "past_due", provider: "stripe", amount: 29, currency: "USD", interval: "month", currentPeriodStart: "2026-01-01T00:00:00Z", currentPeriodEnd: "2026-02-01T00:00:00Z", cancelAtPeriodEnd: false, createdAt: "2025-11-01T00:00:00Z" },
  { id: "sub_004", tenantId: "startup-xyz", tenantName: "Startup XYZ", plan: "PRO", status: "canceled", provider: "stripe", amount: 29, currency: "USD", interval: "month", currentPeriodStart: "2025-12-01T00:00:00Z", currentPeriodEnd: "2026-01-01T00:00:00Z", cancelAtPeriodEnd: true, canceledAt: "2025-12-15T00:00:00Z", createdAt: "2025-06-01T00:00:00Z" },
];

export default function SubscriptionsPage() {
  const [subscriptions] = React.useState(MOCK_SUBSCRIPTIONS);
  const [selectedSub, setSelectedSub] = React.useState<any>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterPlan, setFilterPlan] = React.useState<string>("all");

  const filteredSubs = subscriptions.filter(sub => {
    if (filterStatus !== "all" && sub.status !== filterStatus) return false;
    if (filterPlan !== "all" && sub.plan !== filterPlan) return false;
    return true;
  });

  const totalMRR = subscriptions.filter(s => s.status === "active").reduce((sum, s) => sum + s.amount, 0);
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === "active").length,
    pastDue: subscriptions.filter(s => s.status === "past_due").length,
    canceled: subscriptions.filter(s => s.status === "canceled").length,
    mrr: totalMRR,
  };

  const handleCancelSubscription = (subId: string) => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette subscription ?")) {
      alert(`Subscription ${subId} annulée (mock)`);
    }
  };

  const statusBadgeClass = (status: string) => {
    if (status === "active") return `${styles.badge} ${styles.badgeActive}`;
    if (status === "past_due") return `${styles.badge} ${styles.badgePastDue}`;
    return `${styles.badge} ${styles.badgeCanceled}`;
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Subscriptions</h1>
        <p className={styles.subtitle}>Gestion de toutes les subscriptions actives</p>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total</div>
          <div className={styles.kpiValue}>{stats.total}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Actives</div>
          <div className={styles.kpiValueSuccess}>{stats.active}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>En retard</div>
          <div className={styles.kpiValueWarning}>{stats.pastDue}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Annulées</div>
          <div className={styles.kpiValueMuted}>{stats.canceled}</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardAccent}`}>
          <div className={`${styles.kpiLabel} ${styles.kpiLabelLight}`}>MRR</div>
          <div className={styles.kpiValueWhite}>${stats.mrr}</div>
        </div>
      </div>

      <div className={styles.filters}>
        <div>
          <label className={styles.filterLabel}>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.select}>
            <option value="all">Tous</option>
            <option value="active">Actives</option>
            <option value="past_due">En retard</option>
            <option value="canceled">Annulées</option>
          </select>
        </div>
        <div>
          <label className={styles.filterLabel}>Plan</label>
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className={styles.select}>
            <option value="all">Tous</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.theadRow}>
              <th className={styles.th}>Tenant</th>
              <th className={styles.th}>Plan</th>
              <th className={styles.th}>Provider</th>
              <th className={styles.th}>Montant</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Prochain renouvellement</th>
              <th className={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map(sub => (
              <tr key={sub.id} className={styles.tbodyRow}>
                <td className={styles.td}>
                  <div className={styles.tenantName}>{sub.tenantName}</div>
                  <div className={styles.tenantId}>{sub.tenantId}</div>
                </td>
                <td className={styles.tdPrimary}>{sub.plan}</td>
                <td className={styles.tdCapitalize}>{sub.provider}</td>
                <td className={styles.td}>${sub.amount}/{sub.interval === "month" ? "mois" : "an"}</td>
                <td className={styles.td}>
                  <span className={statusBadgeClass(sub.status)}>{sub.status}</span>
                </td>
                <td className={styles.tdMuted}>{sub.status === "canceled" ? "-" : new Date(sub.currentPeriodEnd).toLocaleDateString()}</td>
                <td className={styles.tdRight}>
                  <button type="button" onClick={() => setSelectedSub(sub)} className={styles.btnSecondary}>Détails</button>
                  {sub.status === "active" && (
                    <button type="button" onClick={() => handleCancelSubscription(sub.id)} className={styles.btnDanger}>Annuler</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSub && (
        <div className={styles.overlay} onClick={() => setSelectedSub(null)} role="dialog" aria-modal="true" aria-label="Détails subscription">
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Détails Subscription</h3>
              <button type="button" onClick={() => setSelectedSub(null)} className={styles.drawerClose} aria-label="Fermer">×</button>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>ID</div>
              <div className={styles.fieldValue}>{selectedSub.id}</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Tenant</div>
              <div>{selectedSub.tenantName}</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Plan</div>
              <div className={styles.fieldValueBold}>{selectedSub.plan}</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Montant</div>
              <div>${selectedSub.amount} {selectedSub.currency} / {selectedSub.interval}</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Période actuelle</div>
              <div>{new Date(selectedSub.currentPeriodStart).toLocaleDateString()} - {new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Créée le</div>
              <div>{new Date(selectedSub.createdAt).toLocaleDateString()}</div>
            </div>
            {selectedSub.cancelAtPeriodEnd && (
              <div className={styles.warningBlock}>
                ⚠️ Sera annulée le {new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
