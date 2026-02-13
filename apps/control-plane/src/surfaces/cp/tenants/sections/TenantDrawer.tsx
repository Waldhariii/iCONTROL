import React from "react";

interface TenantDrawerProps {
  tenantId: string;
  onClose: () => void;
}

export function TenantDrawer({ tenantId, onClose }: TenantDrawerProps) {
  const [activeTab, setActiveTab] = React.useState("synthese");

  const tabs = [
    { id: "synthese", label: "Synthèse" },
    { id: "abonnement", label: "Abonnement" },
    { id: "droits", label: "Droits d'accès" },
    { id: "securite", label: "Sécurité" },
    { id: "branding", label: "Branding" },
    { id: "support", label: "Support & Notes" },
    { id: "historique", label: "Historique" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      {/* Drawer Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: "900px",
          background: "var(--surface-0)",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--surface-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ color: "var(--text-primary)", margin: 0, fontSize: "20px" }}>
              Profil Tenant
            </h2>
            <p style={{ color: "var(--text-muted)", margin: "4px 0 0 0", fontSize: "14px" }}>
              ID: {tenantId}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "0 24px",
            borderBottom: "1px solid var(--surface-border)",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: activeTab === tab.id ? "600" : "400",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {activeTab === "synthese" && <SyntheseTab tenantId={tenantId} />}
          {activeTab === "abonnement" && <AbonnementTab tenantId={tenantId} />}
          {activeTab === "droits" && <DroitsTab tenantId={tenantId} />}
          {activeTab === "securite" && <SecuriteTab tenantId={tenantId} />}
          {activeTab === "branding" && <BrandingTab tenantId={tenantId} />}
          {activeTab === "support" && <SupportTab tenantId={tenantId} />}
          {activeTab === "historique" && <HistoriqueTab tenantId={tenantId} />}
        </div>
      </div>
    </div>
  );
}

// Onglet Synthèse
function SyntheseTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Synthèse</h3>
      
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "var(--surface-1)", padding: "16px", borderRadius: "8px", border: "1px solid var(--surface-border)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Utilisateurs</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>12</div>
        </div>
        <div style={{ background: "var(--surface-1)", padding: "16px", borderRadius: "8px", border: "1px solid var(--surface-border)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Stockage</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>2.4 GB</div>
        </div>
        <div style={{ background: "var(--surface-1)", padding: "16px", borderRadius: "8px", border: "1px solid var(--surface-border)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Erreurs (7j)</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#ef4444" }}>3</div>
        </div>
      </div>

      <p style={{ color: "var(--text-muted)" }}>Graphiques et événements récents à implémenter</p>
    </div>
  );
}

// Onglet Abonnement
function AbonnementTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Abonnement</h3>
      
      <div style={{ background: "var(--surface-1)", padding: "20px", borderRadius: "8px", border: "1px solid var(--surface-border)", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Plan actuel</div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-primary)", marginTop: "4px" }}>FREE</div>
          </div>
          <button style={{
            padding: "8px 16px",
            background: "var(--accent-primary)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500"
          }}>
            Changer de plan
          </button>
        </div>
      </div>

      <p style={{ color: "var(--text-muted)" }}>Gestion des add-ons à implémenter</p>
    </div>
  );
}

// Autres onglets (placeholders)
function DroitsTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Droits d'accès (Entitlements)</h3>
      <p style={{ color: "var(--text-muted)" }}>Matrice Modules/Pages ON/OFF à implémenter</p>
    </div>
  );
}

function SecuriteTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Sécurité</h3>
      <p style={{ color: "var(--text-muted)" }}>Politiques de sécurité à implémenter</p>
    </div>
  );
}

function BrandingTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Branding</h3>
      <p style={{ color: "var(--text-muted)" }}>Thème/logo/tokens à implémenter</p>
    </div>
  );
}

function SupportTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Support & Notes</h3>
      <p style={{ color: "var(--text-muted)" }}>Notes internes + tags support à implémenter</p>
    </div>
  );
}

function HistoriqueTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Historique (Audit)</h3>
      <p style={{ color: "var(--text-muted)" }}>Audit log filtré sur ce tenant à implémenter</p>
    </div>
  );
}
