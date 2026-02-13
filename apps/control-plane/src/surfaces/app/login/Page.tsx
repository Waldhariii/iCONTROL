import { renderReactPage } from "../_shared/renderReactPage";

function LoginApp() {
  return (
    <div className="page-container">
      <h1>APP / LOGIN</h1>
      <p>Connexion (stub UI). Auth branché plus tard via ports.</p>
      <div className="ic-form">
        <label className="ic-form__field">
          Courriel
          <input className="ic-input" type="email" placeholder="you@company.com" />
        </label>
        <label className="ic-form__field">
          Mot de passe
          <input className="ic-input" type="password" placeholder="••••••••" />
        </label>
        <button className="btn-primary" type="button">Se connecter</button>
        
        {/* Lien Créer un compte */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "8px" }}>
            Vous n'avez pas encore de compte ?
          </p>
          <a 
            href="#/signup" 
            style={{ 
              color: "var(--accent-primary)", 
              textDecoration: "none", 
              fontWeight: "600",
              fontSize: "14px"
            }}
          >
            Créer un compte gratuit
          </a>
        </div>
      </div>
    </div>
  );
}

export function renderLoginApp(root: HTMLElement): void {
  renderReactPage(root, LoginApp);
}

export default LoginApp;
