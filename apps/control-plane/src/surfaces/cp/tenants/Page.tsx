import React from "react";
import { canAccessTenants } from "@/runtime/rbac";
import { TenantsList } from "./sections/List";
import { TenantsSegments } from "./sections/Segments";
import { TenantsSuspended } from "./sections/Suspended";
import styles from "./TenantsPage.module.css";

export default function TenantsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("list");

  if (!canAccessTenants()) {
    return (
      <div className={styles.deniedRoot}>
        <h1 className={styles.deniedTitle}>Tenants</h1>
        <p className={styles.deniedText}>Accès refusé.</p>
      </div>
    );
  }

  const tabs = [
    { id: "list", label: "Liste" },
    { id: "segments", label: "Segments & Tags" },
    { id: "suspended", label: "Suspendus" },
  ];

  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Tenants</h1>
      </div>
      <div className={styles.tabsRow}>
        {tabs.map((tab) => (
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
      <div className={styles.content}>
        {activeTab === "list" && <TenantsList />}
        {activeTab === "segments" && <TenantsSegments />}
        {activeTab === "suspended" && <TenantsSuspended />}
      </div>
    </div>
  );
}
