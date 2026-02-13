import { renderReactPage } from "../_shared/renderReactPage";

function AccountApp() {
  return (
    <div className="page-container">
      <h1>APP / ACCOUNT</h1>
      <p>Gérez votre compte et vos paramètres.</p>
      
      <div style={{ marginTop: "32px" }}>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "16px" }}>Liens rapides</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
          
            href="#/account/billing"
            style={{
              padding: "16px",
              background: "var(--surface-1)",
              border: "1px solid var(--surface-border)",
              borderRadius: "8px",
              textDecoration: "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "border-color 0.2s",
            }}
          >
            <div>
              <div style={{ color: "var(--text-primary)", fontWeight: "600", marginBottom: "4px" }}>
                💳 Plan & Abonnement
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Gérez votre plan et votre facturation
              </div>
            </div>
            <span style={{ color: "var(--accent-primary)", fontSize: "20px" }}>→</span>
          </a>

          
            href="#/settings"
            style={{
              padding: "16px",
              background: "var(--surface-1)",
              border: "1px solid var(--surface-border)",
              borderRadius: "8px",
              textDecoration: "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "var(--text-primary)", fontWeight: "600", marginBottom: "4px" }}>
                ⚙️ Paramètres
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Configurez vos préférences
              </div>
            </div>
            <span style={{ color: "var(--accent-primary)", fontSize: "20px" }}>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function renderAccountApp(root: HTMLElement): void {
  renderReactPage(root, AccountApp);
}

export default AccountApp;
