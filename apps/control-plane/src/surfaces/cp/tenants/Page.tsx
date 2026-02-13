import React from "react";
import { canAccessTenants } from "@/runtime/rbac";
import { TenantsList } from "./sections/List";
import { TenantsSegments } from "./sections/Segments";
import { TenantsSuspended } from "./sections/Suspended";

export default function TenantsPage() {
  const [activeTab, setActiveTab] = React.useState<string>("list");

  if (!canAccessTenants()) {
    return (
      <div style={{ padding: "20px" }}>
        <h1 style={{ color: "var(--text-primary)" }}>Tenants</h1>
        <p style={{ color: "var(--text-muted)" }}>Accès refusé.</p>
      </div>
    );
  }

  const tabs = [
    { id: "list", label: "Liste" },
    { id: "segments", label: "Segments & Tags" },
    { id: "suspended", label: "Suspendus" },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header avec titre */}
      <div style={{ 
        padding: "20px 24px", 
        borderBottom: "1px solid var(--surface-border)",
        background: "var(--surface-0)"
      }}>
        <h1 style={{ 
          color: "var(--text-primary)", 
          margin: 0,
          fontSize: "24px",
          fontWeight: "600"
        }}>
          Tenants
        </h1>
      </div>

      {/* Barre d'onglets */}
      <div style={{ 
        display: "flex", 
        gap: "8px",
        padding: "0 24px",
        borderBottom: "1px solid var(--surface-border)",
        background: "var(--surface-0)"
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 20px",
              background: activeTab === tab.id ? "var(--surface-1)" : "transparent",
              color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-muted)",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === tab.id ? "600" : "400",
              transition: "all 0.2s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet */}
      <div style={{ flex: 1, overflow: "auto", background: "var(--surface-0)" }}>
        {activeTab === "list" && <TenantsList />}
        {activeTab === "segments" && <TenantsSegments />}
        {activeTab === "suspended" && <TenantsSuspended />}
      </div>
    </div>
  );
}
