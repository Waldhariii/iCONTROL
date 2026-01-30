/**
 * Page de login pour l'application Administration (CP - Control Plane)
 * Cette page est uniquement accessible pour CP, pas pour APP
 */

import { authenticateManagement } from "../../localAuth";
import { navigate } from "../../runtime/navigate";
import { resolveAppKind } from "../../runtime/appKind";

const CARD_STYLE =
  `max-width:520px;margin:40px auto;padding:24px;border-radius:18px;` +
  "background:var(--ic-card, #1a1a1a);border:1px solid var(--ic-border, #333);color:var(--ic-text, #fff);box-shadow:0 4px 12px rgba(0,0,0,0.3);";

const INPUT_STYLE =
  "width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--ic-border, #333);" +
  "background:var(--ic-panel, #222);color:var(--ic-text, #fff);font-size:14px;box-sizing:border-box;";

const ACTION_STYLE =
  "width:100%;padding:12px 14px;border-radius:12px;border:none;" +
  "background:var(--ic-accent2, #6D28D9);color:#fff;font-weight:700;font-size:14px;cursor:pointer;transition:opacity 0.2s;";

const MUTED_STYLE = "color:var(--ic-mutedText, #999);font-size:13px;margin-top:8px;";
const LINK_STYLE = "color:var(--ic-mutedText, #999);text-decoration:underline;cursor:pointer;font-size:13px;";
const ERROR_STYLE = "color:var(--ic-accent, #ef4444);font-size:13px;margin-top:8px;min-height:20px;";
const SUCCESS_STYLE = "color:#10b981;font-size:13px;margin-top:8px;min-height:20px;";

export function renderLoginCp(root: HTMLElement): void {
  // Vérifier qu'on est bien en mode CP
  const kind = resolveAppKind();
  if (kind !== "CP") {
    root.innerHTML = `<div>
      <p>Cette page est uniquement accessible pour l'application Administration.</p>
      <a href="/cp/#/login">Aller à la page de login CP</a>
    </div>`;
    return;
  }

  root.innerHTML = `
    <div>
      <div>
        <div>
          <div>
            iCONTROL
          </div>
          <div>
            Administration — Connexion
          </div>
        </div>

        <div>
          Accès sécurisé au système d'administration. Entrez vos identifiants pour continuer.
        </div>

        <div>
          <div>
            <label for="login-username">
              Nom d'utilisateur
            </label>
            <input 
              id="login-username" 
              type="text" 
              autocomplete="username"
              placeholder="ex: admin" 
             
            />
          </div>
          
          <div>
            <label for="login-password">
              Mot de passe
            </label>
            <input 
              id="login-password" 
              type="password" 
              autocomplete="current-password"
              placeholder="••••••••" 
             
            />
          </div>

          <div id="login-message"></div>

          <button id="login-submit" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            Se connecter
          </button>

          <div>
            <a href="#/login?forgot=1" id="login-forgot">Mot de passe oublié ?</a>
            <select id="login-lang">
              <option value="fr" selected>FR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind events
  const usernameInput = root.querySelector<HTMLInputElement>("#login-username")!;
  const passwordInput = root.querySelector<HTMLInputElement>("#login-password")!;
  const submitButton = root.querySelector<HTMLButtonElement>("#login-submit")!;
  const messageDiv = root.querySelector<HTMLDivElement>("#login-message")!;

  const setMessage = (text: string, isError: boolean = true) => {
    messageDiv.textContent = text;
    messageDiv.style.color = isError ? "var(--ic-accent, #ef4444)" : "#10b981";
  };

  const clearMessage = () => {
    messageDiv.textContent = "";
  };

  const handleSubmit = () => {
    clearMessage();
    
    const username = (usernameInput.value || "").trim();
    const password = (passwordInput.value || "").trim();

    if (!username || !password) {
      setMessage("Veuillez entrer un nom d'utilisateur et un mot de passe.", true);
      return;
    }

    // Désactiver le bouton pendant l'authentification
    submitButton.disabled = true;
    submitButton.style.opacity = "0.6";
    submitButton.textContent = "Connexion...";

    // Authentifier avec authenticateManagement (pour CP)
    const result = authenticateManagement(username, password);

    if (!result.ok) {
      setMessage(result.error || "Identifiants invalides.", true);
      submitButton.disabled = false;
      submitButton.style.opacity = "1";
      submitButton.textContent = "Se connecter";
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    // Succès
    setMessage(`Connecté en tant que ${result.session.username} (${result.session.role}). Redirection...`, false);
    
    // Rediriger vers le dashboard CP après un court délai
    setTimeout(() => {
      navigate("#/dashboard");
    }, 500);
  };

  submitButton.onclick = handleSubmit;
  
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  });

  usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordInput.focus();
    }
  });

  // Focus sur le champ username au chargement
  setTimeout(() => {
    usernameInput.focus();
  }, 100);
}
