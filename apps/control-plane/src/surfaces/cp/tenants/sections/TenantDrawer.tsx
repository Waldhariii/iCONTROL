import React from "react";
import styles from "./TenantDrawer.module.css";

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
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Profil tenant">
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.headerTitle}>Profil Tenant</h2>
            <p className={styles.headerSub}>ID: {tenantId}</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Fermer">×</button>
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

function SyntheseTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Synthèse</h3>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Utilisateurs</div>
          <div className={styles.kpiValue}>12</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Stockage</div>
          <div className={styles.kpiValue}>2.4 GB</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Erreurs (7j)</div>
          <div className={styles.kpiValueError}>3</div>
        </div>
      </div>
      <p className={styles.sectionText}>Graphiques et événements récents à implémenter</p>
    </div>
  );
}

function AbonnementTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Abonnement</h3>
      <div className={styles.block}>
        <div className={styles.blockRow}>
          <div>
            <div className={styles.blockLabel}>Plan actuel</div>
            <div className={styles.blockValue}>FREE</div>
          </div>
          <button type="button" className={styles.btnPrimary}>Changer de plan</button>
        </div>
      </div>
      <p className={styles.sectionText}>Gestion des add-ons à implémenter</p>
    </div>
  );
}

function DroitsTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Droits d'accès (Entitlements)</h3>
      <p className={styles.sectionText}>Matrice Modules/Pages ON/OFF à implémenter</p>
    </div>
  );
}

function SecuriteTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Sécurité</h3>
      <p className={styles.sectionText}>Politiques de sécurité à implémenter</p>
    </div>
  );
}

function BrandingTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Branding</h3>
      <p className={styles.sectionText}>Thème/logo/tokens à implémenter</p>
    </div>
  );
}

function SupportTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Support & Notes</h3>
      <p className={styles.sectionText}>Notes internes + tags support à implémenter</p>
    </div>
  );
}

function HistoriqueTab({ tenantId }: { tenantId: string }) {
  return (
    <div>
      <h3 className={styles.sectionTitle}>Historique (Audit)</h3>
      <p className={styles.sectionText}>Audit log filtré sur ce tenant à implémenter</p>
    </div>
  );
}
