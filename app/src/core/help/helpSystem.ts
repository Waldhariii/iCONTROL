/**
 * ICONTROL_HELP_SYSTEM_V1
 * Système d'aide contextuelle et documentation
 */

import { createTooltip, addTooltipToElement } from "../ui/tooltip";

export interface HelpContent {
  id: string;
  title: string;
  content: string;
  category?: string;
  related?: string[];
}

class HelpSystem {
  private helpContent: Map<string, HelpContent> = new Map();

  registerHelp(content: HelpContent) {
    this.helpContent.set(content.id, content);
  }

  getHelp(id: string): HelpContent | undefined {
    return this.helpContent.get(id);
  }

  showHelpModal(id: string) {
    const content = this.getHelp(id);
    if (!content) return;

    const modal = document.createElement("div");
  modal.style.minWidth = "0";
  modal.style.boxSizing = "border-box";
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="font-size:18px;font-weight:700;color:#d4d4d4;margin:0;">${content.title}</h3>
          <button id="closeHelp" style="background:transparent;border:none;color:#858585;font-size:24px;cursor:pointer;padding:0;width:32px;height:32px;">×</button>
        </div>
        <div style="color:#d4d4d4;font-size:14px;line-height:1.6;white-space:pre-wrap;">${content.content}</div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector("#closeHelp");
    closeBtn?.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
  }

  addHelpIcon(element: HTMLElement, helpId: string) {
    const helpIcon = document.createElement("span");
    helpIcon.textContent = "❓";
    helpIcon.style.cssText = `
      margin-left: 8px;
      cursor: help;
      font-size: 14px;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
    helpIcon.onmouseenter = () => { helpIcon.style.opacity = "1"; };
    helpIcon.onmouseleave = () => { helpIcon.style.opacity = "0.7"; };
    helpIcon.onclick = (e) => {
      e.stopPropagation();
      this.showHelpModal(helpId);
    };

    addTooltipToElement(helpIcon, "Aide contextuelle", "right");
    element.appendChild(helpIcon);
  }
}

export const helpSystem = new HelpSystem();

// Enregistrer contenu d'aide par défaut
helpSystem.registerHelp({
  id: "dashboard",
  title: "Aide - Tableau de bord",
  content: `Le tableau de bord affiche les métriques et informations principales du système.

Panneaux disponibles:
- API Testing: Tester les endpoints API
- Logs: Voir les logs système en temps réel
- Network Activity: Surveiller l'activité réseau
- Registry Viewer: Explorer le registre système

Utilisez les boutons Actualiser et Exporter pour interagir avec chaque panneau.`
});

helpSystem.registerHelp({
  id: "users",
  title: "Aide - Gestion des utilisateurs",
  content: `Cette page permet de gérer tous les utilisateurs du système.

Fonctionnalités:
- Recherche et filtrage des utilisateurs
- Modification des permissions
- Réinitialisation des mots de passe
- Export de la liste des utilisateurs

Cliquez sur un utilisateur pour modifier ses permissions.`
});

helpSystem.registerHelp({
  id: "sessions",
  title: "Aide - Gestion des sessions",
  content: `Cette page affiche toutes les sessions actives.

Vous pouvez:
- Voir toutes vos sessions actives
- Déconnecter une session spécifique
- Déconnecter toutes les autres sessions

Cela est utile pour sécuriser votre compte si vous avez oublié de vous déconnecter sur un autre appareil.`
});

helpSystem.registerHelp({
  id: "2fa",
  title: "Aide - Authentification à deux facteurs",
  content: `L'authentification à deux facteurs (2FA) ajoute une couche de sécurité supplémentaire à votre compte.

Pour activer:
1. Téléchargez une application d'authentification (Google Authenticator, Authy, etc.)
2. Scannez le code QR affiché
3. Entrez le code à 6 chiffres pour vérifier

Une fois activé, vous devrez entrer ce code à chaque connexion.`
});
