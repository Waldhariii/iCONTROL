import React from "react";

// Mock subscriptions
const MOCK_SUBSCRIPTIONS = [
  {
    id: "sub_001",
    tenantId: "acme-corp",
    tenantName: "Acme Corporation",
    plan: "ENTERPRISE",
    status: "active",
    provider: "stripe",
    amount: 99,
    currency: "USD",
    interval: "month",
    currentPeriodStart: "2026-01-13T00:00:00Z",
    currentPeriodEnd: "2026-02-13T00:00:00Z",
    cancelAtPeriodEnd: false,
    createdAt: "2025-12-13T00:00:00Z",
  },
  {
    id: "sub_002",
    tenantId: "test-inc",
    tenantName: "Test Inc",
    plan: "PRO",
    status: "active",
    provider: "paypal",
    amount: 29,
    currency: "USD",
    interval: "month",
    currentPeriodStart: "2026-01-20T00:00:00Z",
    currentPeriodEnd: "2026-02-20T00:00:00Z",
    cancelAtPeriodEnd: false,
    createdAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "sub_003",
    tenantId: "demo-ltd",
    tenantName: "Demo Limited",
    plan: "PRO",
    status: "past_due",
    provider: "stripe",
    amount: 29,
    currency: "USD",
    interval: "month",
    currentPeriodStart: "2026-01-01T00:00:00Z",
    currentPeriodEnd: "2026-02-01T00:00:00Z",
    cancelAtPeriodEnd: false,
    createdAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "sub_004",
    tenantId: "startup-xyz",
    tenantName: "Startup XYZ",
    plan: "PRO",
    status: "canceled",
    provider: "stripe",
    amount: 29,
    currency: "USD",
    interval: "month",
    currentPeriodStart: "2025-12-01T00:00:00Z",
    currentPeriodEnd: "2026-01-01T00:00:00Z",
    cancelAtPeriodEnd: true,
    canceledAt: "2025-12-15T00:00:00Z",
    createdAt: "2025-06-01T00:00:00Z",
  },
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

  // KPI
  const totalMRR = subscriptions
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.amount, 0);

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

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>
          Subscriptions
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Gestion de toutes les subscriptions actives
        </p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Total</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)" }}>{stats.total}</div>
        </div>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Actives</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981" }}>{stats.active}</div>
        </div>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>En retard</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#f59e0b" }}>{stats.pastDue}</div>
        </div>
        <div style={{ padding: "20px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Annulées</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#6b7280" }}>{stats.canceled}</div>
        </div>
        <div style={{ padding: "20px", background: "var(--accent-primary)", border: "1px solid var(--accent-primary)", borderRadius: "8px" }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "8px" }}>MRR</div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "white" }}>${stats.mrr}</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <div>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              background: "var(--surface-1)",
              border: "1px solid var(--surface-border)",
              borderRadius: "6px",
              color: "var(--text-primary)"
            }}
          >
            <option value="all">Tous</option>
            <option value="active">Actives</option>
            <option value="past_due">En retard</option>
            <option value="canceled">Annulées</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Plan</label>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            style={{
              padding: "8px 12px",
              background: "var(--surface-1)",
              border: "1px solid var(--surface-border)",
              borderRadius: "6px",
              color: "var(--text-primary)"
            }}
          >
            <option value="all">Tous</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-0)", borderBottom: "1px solid var(--surface-border)" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Tenant</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Plan</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Provider</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Montant</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left", color: "var(--text-primary)" }}>Prochain renouvellement</th>
              <th style={{ padding: "12px", textAlign: "right", color: "var(--text-primary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map(sub => (
              <tr key={sub.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ color: "var(--text-primary)", fontWeight: "600" }}>{sub.tenantName}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{sub.tenantId}</div>
                </td>
                <td style={{ padding: "12px", color: "var(--text-primary)", fontWeight: "600" }}>{sub.plan}</td>
                <td style={{ padding: "12px", color: "var(--text-muted)", textTransform: "capitalize" }}>{sub.provider}</td>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>
                  ${sub.amount}/{sub.interval === "month" ? "mois" : "an"}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: 
                      sub.status === "active" ? "#10b981" :
                      sub.status === "past_due" ? "#f59e0b" :
                      "#6b7280",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "11px",
                    textTransform: "uppercase"
                  }}>
                    {sub.status}
                  </span>
                </td>
                <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "13px" }}>
                  {sub.status === "canceled" ? "-" : new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedSub(sub)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--surface-0)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--surface-border)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "8px"
                    }}
                  >
                    Détails
                  </button>
                  {sub.status === "active" && (
                    <button
                      onClick={() => handleCancelSubscription(sub.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer Détails */}
      {selectedSub && (
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
          onClick={() => setSelectedSub(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "500px",
              background: "var(--surface-0)",
              padding: "24px",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <h3 style={{ margin: 0 }}>Détails Subscription</h3>
              <button onClick={() => setSelectedSub(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>ID</div>
              <div style={{ fontFamily: "monospace", fontSize: "14px" }}>{selectedSub.id}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tenant</div>
              <div>{selectedSub.tenantName}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Plan</div>
              <div style={{ fontSize: "18px", fontWeight: "700" }}>{selectedSub.plan}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Montant</div>
              <div>${selectedSub.amount} {selectedSub.currency} / {selectedSub.interval}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Période actuelle</div>
              <div>{new Date(selectedSub.currentPeriodStart).toLocaleDateString()} - {new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Créée le</div>
              <div>{new Date(selectedSub.createdAt).toLocaleDateString()}</div>
            </div>

            {selectedSub.cancelAtPeriodEnd && (
              <div style={{ padding: "12px", background: "#f59e0b", color: "white", borderRadius: "6px", marginBottom: "16px" }}>
                ⚠️ Sera annulée le {new Date(selectedSub.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
