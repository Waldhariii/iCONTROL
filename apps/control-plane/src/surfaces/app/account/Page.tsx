import { renderReactPage } from "../_shared/renderReactPage";

function AccountApp() {
  return (
    <div className="page-container">
      <h1>APP / ACCOUNT</h1>
      <p>Gérez votre compte et vos paramètres.</p>
      
      <div style={{ marginTop: "32px" }}>
        <h2>Liens rapides</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
          <a href="#/account/billing" style={{ padding: "16px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px", textDecoration: "none", display: "block" }}>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Plan et Abonnement</div>
            <div style={{ fontSize: "14px" }}>Gérez votre plan et votre facturation</div>
          </a>

          <a href="#/settings" style={{ padding: "16px", background: "var(--surface-1)", border: "1px solid var(--surface-border)", borderRadius: "8px", textDecoration: "none", display: "block" }}>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Paramètres</div>
            <div style={{ fontSize: "14px" }}>Configurez vos préférences</div>
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
