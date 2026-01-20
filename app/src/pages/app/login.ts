/**
 * ICONTROL_APP_LOGIN_V1
 * Page de connexion pour l'application CLIENT (/app)
 */
import { authenticate } from "/src/localAuth";
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { debugLog, errorLog } from "/src/core/utils/logger";
import { createLoginSubmit, attachLoginListeners } from "../_shared/loginHelpers";

const CARD_STYLE =
  `min-width:400px;max-width:480px;width:100%;margin:40px auto;padding:32px;border-radius:12px;` +
  "background:#1e1e1e;border:1px solid #3e3e3e;color:#d4d4d4;box-shadow:0 8px 24px rgba(0,0,0,0.3);";
const INPUT_STYLE =
  "padding:10px 12px;border-radius:8px;border:1px solid #3e3e3e;" +
  "background:#252526;color:#d4d4d4;width:100%;font-size:14px;outline:none;transition:border-color 0.2s;";
const ACTION_STYLE =
  "padding:10px 12px;border-radius:8px;border:1px solid #3e3e3e;" +
  "background:#37373d;color:#ffffff;font-weight:600;cursor:pointer;width:100%;font-size:14px;transition:background-color 0.2s;";
const MUTED_STYLE = "color:#858585;";
const LINK_STYLE = "color:#9cdcfe;text-decoration:none;font-size:13px;";

export function renderLogin(root: HTMLElement): void {
  debugLog("🔵 renderLogin APP appelé", { id: root.id, className: root.className });
  
  if (!root || !root.appendChild) {
    errorLog("❌ ERREUR: root n'est pas un élément HTMLElement valide", root);
    return;
  }

  // ICONTROL_LOGIN_FORCE_STYLES_V1: Forcer les styles de base si nécessaire
  if (!document.querySelector('style[data-core-styles]')) {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-core-styles', '1');
    styleEl.textContent = coreBaseStyles().replace(/<style>|<\/style>/g, '');
    document.head.appendChild(styleEl);
    debugLog("✅ Styles de base injectés dans head");
  }

  const html = `
    <div style="position:relative;width:100%;height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#1e1e1e;">
      <div style="position:absolute;top:20px;right:20px;display:flex;gap:0;z-index:10;">
        <button id="lang-fr" style="background:#252526;color:#d4d4d4;border:1px solid #3e3e3e;border-right:none;padding:4px 8px;border-radius:6px 0 0 6px;cursor:pointer;font-weight:500;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.2s;">
          <span style="font-size:14px;">🇨🇦</span> FR
        </button>
        <button id="lang-en" style="background:#252526;color:#d4d4d4;border:1px solid #3e3e3e;padding:4px 8px;border-radius:0 6px 6px 0;cursor:pointer;font-weight:500;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.2s;">
          <span style="font-size:14px;">🇺🇸</span> EN
        </button>
      </div>
      <div style="${CARD_STYLE}">
        <div style="font-size:24px;font-weight:600;color:#d4d4d4;text-align:center;margin-bottom:8px;letter-spacing:-0.3px;">Connexion</div>
        <div style="margin-top:28px;display:flex;flex-direction:column;gap:12px">
          <input id="u" placeholder="Nom d'utilisateur" style="${INPUT_STYLE}" />
          <input id="p" type="password" placeholder="Mot de passe" style="${INPUT_STYLE}" />
          <div id="err" style="min-height:18px;color:#f48771;font-size:13px;"></div>
          <button id="btn" style="${ACTION_STYLE}">Se connecter</button>
          <div style="margin-top:8px;text-align:center;display:flex;justify-content:center;gap:16px;">
            <a href="#/login" id="forgot" style="${LINK_STYLE}">Mot de passe oublié</a>
            <a href="#/register" id="create-account" style="${LINK_STYLE}">Créer un compte</a>
          </div>
        </div>
      </div>
    </div>
  `;

  root.innerHTML = html;
  debugLog("✅ HTML injecté dans root", { length: root.innerHTML.length });
  
  // ICONTROL_LOGIN_VISIBILITY_CHECK_V1: Vérifier la visibilité du contenu (debug uniquement)
  const cardEl = root.querySelector<HTMLElement>('div[style*="max-width:480px"]');
  if (!cardEl) {
    errorLog("❌ ERREUR: Carte non trouvée dans root");
  } else {
    debugLog("✅ Carte trouvée", {
      width: cardEl.getBoundingClientRect().width,
      height: cardEl.getBoundingClientRect().height,
    });
  }

  const u = root.querySelector<HTMLInputElement>("#u");
  const p = root.querySelector<HTMLInputElement>("#p");
  const err = root.querySelector<HTMLDivElement>("#err");
  const btn = root.querySelector<HTMLButtonElement>("#btn");

  if (!u || !p || !err || !btn) {
    errorLog("❌ ERREUR: Éléments DOM non trouvés", { u: !!u, p: !!p, err: !!err, btn: !!btn });
    return;
  }

  // Styles pour les inputs (gris)
  u.addEventListener("focus", () => {
    u.style.borderColor = "#4ec9b0";
  });
  u.addEventListener("blur", () => {
    u.style.borderColor = "#3e3e3e";
  });
  p.addEventListener("focus", () => {
    p.style.borderColor = "#4ec9b0";
  });
  p.addEventListener("blur", () => {
    p.style.borderColor = "#3e3e3e";
  });

  // Style hover pour le bouton (gris)
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#454545";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "#37373d";
  });

  // Style hover pour les liens
  const forgotLink = root.querySelector<HTMLAnchorElement>("#forgot");
  const createAccountLink = root.querySelector<HTMLAnchorElement>("#create-account");
  
  if (forgotLink) {
    forgotLink.addEventListener("mouseenter", () => {
      forgotLink.style.textDecoration = "underline";
    });
    forgotLink.addEventListener("mouseleave", () => {
      forgotLink.style.textDecoration = "none";
    });
  }
  
  if (createAccountLink) {
    createAccountLink.addEventListener("mouseenter", () => {
      createAccountLink.style.textDecoration = "underline";
    });
    createAccountLink.addEventListener("mouseleave", () => {
      createAccountLink.style.textDecoration = "none";
    });
  }

  debugLog("✅ Éléments DOM trouvés");

  // ICONTROL_LOGIN_SHARED_CODE_V1: Utiliser la fonction partagée pour éviter la duplication
  const submit = createLoginSubmit({ u, p, err, btn }, authenticate, "APP");
  attachLoginListeners({ u, p, err, btn }, submit);

  // Sélecteur de langue avec boutons
  const langFr = root.querySelector<HTMLButtonElement>("#lang-fr");
  const langEn = root.querySelector<HTMLButtonElement>("#lang-en");
  let currentLang = "fr";

  if (langFr && langEn) {
    const activeStyle = "background:var(--ic-accent2, #7c3aed);color:white;border-color:var(--ic-accent2, #7c3aed);";
    const inactiveStyle = "background:var(--ic-panel, #1a1d1f);color:var(--ic-text, #e7ecef);border-color:var(--ic-border, #2b3136);";
    
    langFr.style.cssText = `background:#37373d;color:white;border:1px solid #37373d;border-right:none;padding:4px 8px;border-radius:6px 0 0 6px;cursor:pointer;font-weight:500;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.2s;`;
    
    langFr.onclick = () => {
      if (currentLang !== "fr") {
        currentLang = "fr";
        langFr.style.cssText = `background:#37373d;color:white;border:1px solid #37373d;border-right:none;padding:4px 8px;border-radius:6px 0 0 6px;cursor:pointer;font-weight:500;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.2s;`;
        langEn.style.cssText = `background:#252526;color:#d4d4d4;border:1px solid #3e3e3e;padding:4px 8px;border-radius:0 6px 6px 0;cursor:pointer;font-weight:500;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.2s;`;
      }
    };
    
    langEn.onclick = () => {
      if (currentLang !== "en") {
        currentLang = "en";
        langEn.style.cssText = `background:#37373d;color:white;border:1px solid #37373d;padding:4px 8px;border-radius:0 6px 6px 0;cursor:pointer;font-weight:500;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.2s;`;
        langFr.style.cssText = `background:#252526;color:#d4d4d4;border:1px solid #3e3e3e;border-right:none;padding:4px 8px;border-radius:6px 0 0 6px;cursor:pointer;font-weight:500;font-size:12px;display:flex;align-items:center;gap:4px;transition:all 0.2s;`;
      }
    };
  }
}
