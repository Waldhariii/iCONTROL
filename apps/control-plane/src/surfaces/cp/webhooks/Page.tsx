import React from "react";
import styles from "./WebhooksPage.module.css";

// Mock data pour démonstration
const MOCK_WEBHOOKS = [
  {
    id: "wh_001",
    provider: "stripe",
    eventType: "payment.succeeded",
    receivedAt: "2026-02-13T10:30:00Z",
    processedAt: "2026-02-13T10:30:01Z",
    status: "success",
    tenantId: "acme-corp",
    actions: [
      { type: "update_tenant_plan", payload: { tenantId: "acme-corp", newPlan: "PRO" } },
      { type: "send_email", payload: { email: { to: "admin@acme.com", subject: "Payment succeeded" } } }
    ],
  },
  {
    id: "wh_002",
    provider: "paypal",
    eventType: "subscription.canceled",
    receivedAt: "2026-02-13T09:15:00Z",
    processedAt: "2026-02-13T09:15:02Z",
    status: "success",
    tenantId: "test-inc",
    actions: [
      { type: "suspend_tenant", payload: { tenantId: "test-inc", reason: "Subscription canceled" } }
    ],
  },
  {
    id: "wh_003",
    provider: "stripe",
    eventType: "invoice.payment_failed",
    receivedAt: "2026-02-13T08:00:00Z",
    processedAt: "2026-02-13T08:00:05Z",
    status: "failed",
    tenantId: "demo-ltd",
    error: "Tenant not found",
    actions: [],
  },
];

export default function WebhooksPage() {
  const [webhooks] = React.useState(MOCK_WEBHOOKS);
  const [selectedWebhook, setSelectedWebhook] = React.useState<any>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>("all");

  const filteredWebhooks = webhooks.filter(wh =>
    filterStatus === "all" || wh.status === filterStatus
  );

  const stats = {
    total: webhooks.length,
    success: webhooks.filter(w => w.status === "success").length,
    failed: webhooks.filter(w => w.status === "failed").length,
    pending: webhooks.filter(w => w.status === "pending").length,
  };

  const badgeClass = (status: string) => {
    if (status === "success") return `${styles.badge} ${styles.badgeSuccess}`;
    if (status === "failed") return `${styles.badge} ${styles.badgeFailed}`;
    return `${styles.badge} ${styles.badgePending}`;
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Webhooks</h1>
        <p className={styles.subtitle}>
          Historique des webhooks reçus des providers de paiement
        </p>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total</div>
          <div className={styles.kpiValue}>{stats.total}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Succès</div>
          <div className={styles.kpiValueSuccess}>{stats.success}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Échecs</div>
          <div className={styles.kpiValueFailed}>{stats.failed}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>En attente</div>
          <div className={styles.kpiValuePending}>{stats.pending}</div>
        </div>
      </div>

      <div className={styles.filters}>
        {["all", "success", "failed", "pending"].map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={filterStatus === status ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
          >
            {status === "all" ? "Tous" : status}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.theadRow}>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Provider</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Tenant</th>
              <th className={styles.th}>Reçu</th>
              <th className={styles.th}>Status</th>
              <th className={styles.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWebhooks.map(webhook => (
              <tr key={webhook.id} className={styles.tbodyRow}>
                <td className={styles.tdMono}>{webhook.id}</td>
                <td className={styles.tdCapitalize}>{webhook.provider}</td>
                <td className={styles.tdMuted}>{webhook.eventType}</td>
                <td className={styles.td}>{webhook.tenantId || "-"}</td>
                <td className={styles.tdMuted}>
                  {new Date(webhook.receivedAt).toLocaleString()}
                </td>
                <td className={styles.td}>
                  <span className={badgeClass(webhook.status)}>
                    {webhook.status}
                  </span>
                </td>
                <td className={styles.tdRight}>
                  <button
                    type="button"
                    onClick={() => setSelectedWebhook(webhook)}
                    className={styles.btnDetail}
                  >
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedWebhook && (
        <div
          className={styles.overlay}
          onClick={() => setSelectedWebhook(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Détails webhook"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={styles.drawer}
          >
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Détails Webhook</h3>
              <button
                type="button"
                onClick={() => setSelectedWebhook(null)}
                className={styles.drawerClose}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>ID</div>
              <div className={styles.fieldValueMono}>{selectedWebhook.id}</div>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>Provider</div>
              <div className={styles.fieldValueCapitalize}>{selectedWebhook.provider}</div>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>Type</div>
              <div className={styles.fieldValue}>{selectedWebhook.eventType}</div>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>Actions exécutées</div>
              {selectedWebhook.actions.length === 0 ? (
                <div className={styles.emptyActions}>Aucune action</div>
              ) : (
                <ul className={styles.actionsList}>
                  {selectedWebhook.actions.map((action: any, i: number) => (
                    <li key={i} className={styles.actionsItem}>
                      <strong>{action.type}</strong>
                      <pre className={styles.prePayload}>
                        {JSON.stringify(action.payload, null, 2)}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedWebhook.error && (
              <div className={styles.errorBlock}>
                Erreur : {selectedWebhook.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
