import React from "react";

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

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>
          Webhooks
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Historique des webhooks reçus des providers de paiement
        </p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Total</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)" }}>{stats.total}</div>
        </div>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Succès</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981" }}>{stats.success}</div>
        </div>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Échecs</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#ef4444" }}>{stats.failed}</div>
        </div>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>En attente</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#f59e0b" }}>{stats.pending}</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["all", "success", "failed", "pending"].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: "8px 16px",
              background: filterStatus === status ? "var(--accent-primary)" : "var(--surface-1)",
              color: filterStatus === status ? "white" : "var(--text-primary)",
              border: "1px solid var(--surface-border)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              textTransform: "capitalize"
            }}
          >
            {status === "all" ? "Tous" : status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-0)", borderBottom: "1px solid var(--surface-border)" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>ID</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Provider</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Type</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Tenant</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Reçu</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "right", color: "var(--text-primary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWebhooks.map(webhook => (
              <tr key={webhook.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                <td style={{ padding: "12px", color: "var(--text-primary)", fontFamily: "monospace", fontSize: "13px" }}>
                  {webhook.id}
                </td>
                <td style={{ padding: "12px", color: "var(--text-primary)", textTransform: "capitalize" }}>
                  {webhook.provider}
                </td>
                <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "13px" }}>
                  {webhook.eventType}
                </td>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>
                  {webhook.tenantId || "-"}
                </td>
                <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "13px" }}>
                  {new Date(webhook.receivedAt).toLocaleString()}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: webhook.status === "success" ? "#10b981" : webhook.status === "failed" ? "#ef4444" : "#f59e0b",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "11px",
                    textTransform: "uppercase"
                  }}>
                    {webhook.status}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedWebhook(webhook)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--surface-0)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--surface-border)",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer Détails */}
      {selectedWebhook && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setSelectedWebhook(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "600px",
              background: "var(--surface-0)",
              padding: "24px",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <h3 style={{ color: "var(--text-primary)", margin: 0 }}>Détails Webhook</h3>
              <button onClick={() => setSelectedWebhook(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>ID</div>
              <div style={{ fontFamily: "monospace", fontSize: "14px" }}>{selectedWebhook.id}</div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Provider</div>
              <div style={{ textTransform: "capitalize" }}>{selectedWebhook.provider}</div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Type</div>
              <div>{selectedWebhook.eventType}</div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Actions exécutées</div>
              {selectedWebhook.actions.length === 0 ? (
                <div style={{ color: "var(--text-muted)" }}>Aucune action</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {selectedWebhook.actions.map((action: any, i: number) => (
                    <li key={i} style={{ marginBottom: "8px" }}>
                      <strong>{action.type}</strong>
                      <pre style={{ fontSize: "12px", background: "var(--surface-1)", padding: "8px", borderRadius: "4px", marginTop: "4px" }}>
                        {JSON.stringify(action.payload, null, 2)}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedWebhook.error && (
              <div style={{ padding: "12px", background: "#ef4444", color: "white", borderRadius: "6px" }}>
                Erreur : {selectedWebhook.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
