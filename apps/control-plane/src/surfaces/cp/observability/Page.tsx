import React from "react";
import styles from "./ObservabilityPage.module.css";

type TabId = "events" | "audit" | "alerts";

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

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Observabilité</h1>
        <p className={styles.subtitle}>Logs, audit trail et alertes système</p>
      </div>

      <div className={styles.tabsBar}>
        <div className={styles.tabsRow}>
          {([{ id: "events" as TabId, label: "Événements" }, { id: "audit" as TabId, label: "Audit" }, { id: "alerts" as TabId, label: "Alertes" }]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "events" && <EventsTab />}
      {activeTab === "audit" && <AuditTab />}
      {activeTab === "alerts" && <AlertsTab />}
    </div>
  );
}

function EventsTab() {
  const [events] = React.useState(MOCK_EVENTS);
  const [filterLevel, setFilterLevel] = React.useState("all");
  const filteredEvents = events.filter(e => filterLevel === "all" || e.level === filterLevel);

  const levelBadgeClass = (level: string) => {
    if (level === "error") return `${styles.badge} ${styles.badgeError}`;
    if (level === "warning") return `${styles.badge} ${styles.badgeWarning}`;
    return `${styles.badge} ${styles.badgeSuccess}`;
  };

  return (
    <div>
      <div className={styles.filters}>
        {["all", "info", "warning", "error"].map(level => (
          <button
            key={level}
            type="button"
            onClick={() => setFilterLevel(level)}
            className={filterLevel === level ? `${styles.filterBtn} ${styles.filterBtnActive}` : styles.filterBtn}
          >
            {level === "all" ? "Tous" : level}
          </button>
        ))}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.theadRow}>
              <th className={styles.th}>Timestamp</th>
              <th className={styles.th}>Level</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Message</th>
              <th className={styles.th}>Tenant</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id} className={styles.tbodyRow}>
                <td className={styles.tdMuted}>{new Date(event.timestamp).toLocaleString()}</td>
                <td className={styles.td}>
                  <span className={levelBadgeClass(event.level)}>{event.level}</span>
                </td>
                <td className={styles.tdMuted}>{event.category}</td>
                <td className={styles.tdPrimary}>{event.message}</td>
                <td className={styles.tdMuted}>{event.tenantId}</td>
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
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.theadRow}>
            <th className={styles.th}>Timestamp</th>
            <th className={styles.th}>Actor</th>
            <th className={styles.th}>Action</th>
            <th className={styles.th}>Resource</th>
            <th className={styles.th}>Details</th>
            <th className={styles.th}>IP</th>
          </tr>
        </thead>
        <tbody>
          {audit.map(entry => (
            <tr key={entry.id} className={styles.tbodyRow}>
              <td className={styles.tdMuted}>{new Date(entry.timestamp).toLocaleString()}</td>
              <td className={styles.tdPrimary}>{entry.actor}</td>
              <td className={styles.auditAction}>{entry.action}</td>
              <td className={styles.tdMuted}>{entry.resource}</td>
              <td className={styles.tdPrimary}>{entry.details}</td>
              <td className={styles.tdMuted}>{entry.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTab() {
  const [alerts] = React.useState(MOCK_ALERTS);

  const cardBorderClass = (severity: string) => {
    if (severity === "critical") return `${styles.alertCard} ${styles.alertCardCritical}`;
    if (severity === "warning") return `${styles.alertCard} ${styles.alertCardWarning}`;
    return `${styles.alertCard} ${styles.alertCardInfo}`;
  };

  const severityClass = (severity: string) => {
    if (severity === "critical") return `${styles.alertSeverity} ${styles.badgeError}`;
    if (severity === "warning") return `${styles.alertSeverity} ${styles.badgeWarning}`;
    return `${styles.alertSeverity} ${styles.badgeSuccess}`;
  };

  return (
    <div className={styles.alertsGrid}>
      {alerts.map(alert => (
        <div key={alert.id} className={cardBorderClass(alert.severity)}>
          <div className={styles.alertHeader}>
            <div className={styles.alertTitleRow}>
              <span className={severityClass(alert.severity)}>{alert.severity}</span>
              <h3 className={styles.alertTitle}>{alert.title}</h3>
            </div>
            <span className={alert.status === "active" ? `${styles.alertStatus} ${styles.alertStatusActive}` : `${styles.alertStatus} ${styles.alertStatusResolved}`}>
              {alert.status}
            </span>
          </div>
          <p className={styles.alertDesc}>{alert.description}</p>
          <div className={styles.alertMeta}>Déclenchée : {new Date(alert.triggeredAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
