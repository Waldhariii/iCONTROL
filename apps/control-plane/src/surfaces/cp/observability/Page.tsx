import React from "react";

type TabId = "events" | "audit" | "alerts";

// Mock data
const MOCK_EVENTS = [
  { id: "evt_001", timestamp: "2026-02-13T16:30:00Z", level: "info", category: "auth", message: "User login successful", tenantId: "acme-corp", userId: "john@acme.com" },
  { id: "evt_002", timestamp: "2026-02-13T16:25:00Z", level: "warning", category: "billing", message: "Payment retry scheduled", tenantId: "test-inc", userId: "system" },
  { id: "evt_003", timestamp: "2026-02-13T16:20:00Z", level: "error", category: "api", message: "Rate limit exceeded", tenantId: "demo-ltd", userId: "api@demo.com" },
  { id: "evt_004", timestamp: "2026-02-13T16:15:00Z", level: "info", category: "tenant", message: "Tenant created", tenantId: "startup-xyz", userId: "admin@startup.com" },
];

const MOCK_AUDIT = [
  { id: "aud_001", timestamp: "2026-02-13T16:30:00Z", actor: "john@acme.com", action: "tenant.plan.update", resource: "acme-corp", details: "FREE → PRO", ip: "192.168.1.100" },
  { id: "aud_002", timestamp: "2026-02-13T16:20:00Z", actor: "admin@icontrol.com", action: "user.delete", resource: "test-inc/user-123", details: "Deleted user account", ip: "10.0.0.50" },
  { id: "aud_003", timestamp: "2026-02-13T16:10:00Z", actor: "system", action: "payment.webhook", resource: "sub_xyz", details: "Payment succeeded", ip: "54.12.34.56" },
];

const MOCK_ALERTS = [
  { id: "alt_001", severity: "critical", title: "High error rate detected", description: "Error rate > 5% in last 5 minutes", triggeredAt: "2026-02-13T16:35:00Z", status: "active" },
  { id: "alt_002", severity: "warning", title: "Payment retry scheduled", description: "3 failed payments in last hour", triggeredAt: "2026-02-13T16:25:00Z", status: "active" },
  { id: "alt_003", severity: "info", title: "Daily backup completed", description: "Database backup successful", triggeredAt: "2026-02-13T02:00:00Z", status: "resolved" },
];

export default function ObservabilityPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("events");

  const renderTabContent = () => {
    switch (activeTab) {
      case "events":
        return <EventsTab />;
      case "audit":
        return <AuditTab />;
      case "alerts":
        return <AlertsTab />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: "700", margin: "0 0 8px 0" }}>
          Observabilité
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Logs, audit trail et alertes système
        </p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "2px solid var(--surface-border)", marginBottom: "32px" }}>
        <div style={{ display: "flex", gap: "32px" }}>
          {[
            { id: "events" as TabId, label: "Événements" },
            { id: "audit" as TabId, label: "Audit" },
            { id: "alerts" as TabId, label: "Alertes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: activeTab === tab.id ? "600" : "400",
                marginBottom: "-2px"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderTabContent()}
    </div>
  );
}

function EventsTab() {
  const [events] = React.useState(MOCK_EVENTS);
  const [filterLevel, setFilterLevel] = React.useState("all");

  const filteredEvents = events.filter(e => filterLevel === "all" || e.level === filterLevel);

  return (
    <div>
      {/* Filtres */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {["all", "info", "warning", "error"].map(level => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            style={{
              padding: "8px 16px",
              background: filterLevel === level ? "var(--accent-primary)" : "var(--surface-1)",
              color: filterLevel === level ? "white" : "var(--text-primary)",
              border: "1px solid var(--surface-border)",
              borderRadius: "6px",
              cursor: "pointer",
              textTransform: "capitalize"
            }}
          >
            {level === "all" ? "Tous" : level}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-0)", borderBottom: "1px solid var(--surface-border)" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Timestamp</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Level</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Category</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Message</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Tenant</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
                  {new Date(event.timestamp).toLocaleString()}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px",
                    background: event.level === "error" ? "#ef4444" : event.level === "warning" ? "#f59e0b" : "#10b981",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "11px",
                    textTransform: "uppercase"
                  }}>
                    {event.level}
                  </span>
                </td>
                <td style={{ padding: "12px", color: "var(--text-muted)" }}>{event.category}</td>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>{event.message}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{event.tenantId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const [audit] = React.useState(MOCK_AUDIT);

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--surface-0)", borderBottom: "1px solid var(--surface-border)" }}>
            <th style={{ padding: "12px", textAlign: "left" }}>Timestamp</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Actor</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Action</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Resource</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Details</th>
            <th style={{ padding: "12px", textAlign: "left" }}>IP</th>
          </tr>
        </thead>
        <tbody>
          {audit.map(entry => (
            <tr key={entry.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
              <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
                {new Date(entry.timestamp).toLocaleString()}
              </td>
              <td style={{ padding: "12px", color: "var(--text-primary)" }}>{entry.actor}</td>
              <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "13px", color: "var(--accent-primary)" }}>
                {entry.action}
              </td>
              <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{entry.resource}</td>
              <td style={{ padding: "12px", color: "var(--text-primary)" }}>{entry.details}</td>
              <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{entry.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTab() {
  const [alerts] = React.useState(MOCK_ALERTS);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {alerts.map(alert => (
        <div
          key={alert.id}
          style={{
            padding: "20px",
            background: "var(--surface-1)",
            border: `2px solid ${alert.severity === "critical" ? "#ef4444" : alert.severity === "warning" ? "#f59e0b" : "#10b981"}`,
            borderRadius: "8px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{
                padding: "4px 12px",
                background: alert.severity === "critical" ? "#ef4444" : alert.severity === "warning" ? "#f59e0b" : "#10b981",
                color: "white",
                borderRadius: "4px",
                fontSize: "11px",
                textTransform: "uppercase",
                fontWeight: "600"
              }}>
                {alert.severity}
              </span>
              <h3 style={{ margin: 0, color: "var(--text-primary)" }}>{alert.title}</h3>
            </div>
            <span style={{
              padding: "4px 12px",
              background: alert.status === "active" ? "#f59e0b" : "#6b7280",
              color: "white",
              borderRadius: "4px",
              fontSize: "11px",
              textTransform: "uppercase"
            }}>
              {alert.status}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", margin: "0 0 12px 0" }}>{alert.description}</p>
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Déclenchée : {new Date(alert.triggeredAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
