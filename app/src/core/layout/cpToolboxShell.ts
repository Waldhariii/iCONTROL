/**
 * ICONTROL_CP_TOOLBOX_SHELL_V1
 * Shell global style Developer Toolbox pour toute l'application CP
 * - Barre d'onglets en haut (navigation principale)
 * - Sidebar gauche (ressources et actions)
 * - Zone principale avec panneaux en grille 2x2
 */

import { getSession, isLoggedIn, logout } from "../../localAuth";
import { getBrand } from "../../../../platform-services/branding/brandService";
import { getAvatarConfig, getInitials } from "../user/avatarManager";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { getAppKind } from "../../pages/appContext";
import { navigate, getCurrentHash } from "/src/runtime/navigate";
import { CP_NAV_ITEMS } from "../ui/commandPalette";
import { createNotificationCenter, notificationManager } from "../ui/notificationCenter";
import "./cpToolboxShell.css";

export interface CPNavTab {
  id: string;
  label: string;
  icon?: string;
  hash: string;
  show: () => boolean;
}

export interface CPSidebarSection {
  id: string;
  title: string;
  items: Array<{
    id: string;
    label: string;
    icon?: string;
    checked?: boolean;
    onClick?: () => void;
  }>;
}

/**
 * Crée le shell complet style Developer Toolbox pour CP
 */
export function createCPToolboxShell(options: {
  tabs: CPNavTab[];
  sidebarSections: CPSidebarSection[];
  contentArea: HTMLElement;
}): HTMLElement {
  const container = document.createElement("div");
  container.className = "icontrol-cp-toolbox-shell";
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: var(--ic-bg, #0f1112);
    color: var(--ic-text, #e7ecef);
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  `;

  // Top Navigation Bar avec onglets
  const topNav = createTopNav(options.tabs);
  container.appendChild(topNav);

  // Container principal (sidebar + content)
  const mainContainer = document.createElement("div");
  mainContainer.className = "icontrol-cp-main-container";
  mainContainer.style.cssText = `
    display: flex;
    flex: 1;
    overflow: hidden;
  `;

  // Sidebar gauche (cachée par défaut sur mobile, visible sur desktop)
  const sidebar = createSidebar(options.sidebarSections);
  sidebar.className = "icontrol-cp-sidebar icontrol-cp-sidebar-hidden";
  mainContainer.appendChild(sidebar);

  // Overlay pour fermer le sidebar sur mobile
  const overlay = document.createElement("div");
  overlay.className = "icontrol-cp-sidebar-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 85;
    display: none;
  `;
  overlay.onclick = () => {
    sidebar.classList.add("icontrol-cp-sidebar-hidden");
    overlay.style.display = "none";
  };
  mainContainer.appendChild(overlay);

  // Toggle sidebar avec le burger
  const burger = topNav.querySelector(".icontrol-cp-burger") as HTMLElement;
  if (burger) {
    burger.onclick = () => {
      const isHidden = sidebar.classList.contains("icontrol-cp-sidebar-hidden");
      if (isHidden) {
        sidebar.classList.remove("icontrol-cp-sidebar-hidden");
        overlay.style.display = "block";
        // Animation burger: ✕ quand ouvert
        burger.innerHTML = "✕";
        burger.style.fontSize = "20px";
      } else {
        sidebar.classList.add("icontrol-cp-sidebar-hidden");
        overlay.style.display = "none";
        // Animation burger: ☰ quand fermé
        burger.innerHTML = "☰";
        burger.style.fontSize = "18px";
      }
    };
  }

  // Zone de contenu
  const contentWrapper = document.createElement("div");
  contentWrapper.className = "icontrol-cp-content-wrapper";
  // Styles sont dans le CSS
  contentWrapper.appendChild(options.contentArea);
  mainContainer.appendChild(contentWrapper);

  container.appendChild(mainContainer);

  return container;
}

/**
 * Crée la barre de navigation supérieure avec onglets
 */
function createTopNav(tabs: CPNavTab[]): HTMLElement {
  const nav = document.createElement("div");
  nav.className = "icontrol-cp-topnav";
  nav.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 16px;
    background: var(--ic-panel2, #202427);
    border-bottom: 1px solid var(--ic-border, #2b3136);
    flex-shrink: 0;
    z-index: 10;
  `;

  // Zone branding/navigation (burger + nom application) - STRUCTURE PROFESSIONNELLE
  const leftSection = document.createElement("div");
  leftSection.className = "icontrol-cp-left-section";
  // Styles dans CSS

  // Burger menu (navigation)
  const burger = document.createElement("button");
  burger.className = "icontrol-cp-burger";
  burger.innerHTML = "☰";
  burger.type = "button";
  burger.setAttribute("aria-label", "Toggle menu");

  // Nom de l'application (branding)
  const brandTitle = document.createElement("div");
  brandTitle.className = "icontrol-cp-brand-title";
  brandTitle.textContent = "Console";

  leftSection.appendChild(burger);
  leftSection.appendChild(brandTitle);
  nav.appendChild(leftSection);

  // Section droite: Notifications + Indicateur système (collé à droite)
  const rightSection = document.createElement("div");
  rightSection.className = "icontrol-cp-right-section";
  rightSection.style.cssText = `
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    padding-right: 0;
    min-width: 0;
  `;

  // Centre de notifications
  const { button: notifButton } = createNotificationCenter();
  rightSection.appendChild(notifButton);

  // Indicateur d'état système en temps réel et interactif (collé à droite)
  const systemStatusIndicator = document.createElement("button");
  systemStatusIndicator.className = "icontrol-cp-system-status";
  systemStatusIndicator.id = "icontrol-system-status-indicator";
  systemStatusIndicator.type = "button";
  systemStatusIndicator.style.cssText = `
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.03);
    color: var(--ic-text, #e7ecef);
    position: relative;
    margin-right: 16px;
  `;
  systemStatusIndicator.setAttribute("aria-label", "État du système");
  
  // Contenu initial pour que l'indicateur soit visible immédiatement
  systemStatusIndicator.innerHTML = `<span>iCONTROL</span>`;
  systemStatusIndicator.classList.add("status-healthy");
  
  // Popup d'informations système (cachée par défaut)
  const systemStatusPopup = document.createElement("div");
  systemStatusPopup.className = "icontrol-cp-system-status-popup";
  systemStatusPopup.style.cssText = `
    position: fixed;
    top: 56px;
    right: 16px;
    width: 320px;
    padding: 16px;
    background: var(--ic-panel, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 10002;
    display: none;
    flex-direction: column;
    gap: 12px;
    font-size: 12px;
  `;

  // Gestion de l'affichage/masquage de la popup
  let popupVisible = false;
  systemStatusIndicator.onclick = (e) => {
    e.stopPropagation();
    popupVisible = !popupVisible;
    systemStatusPopup.style.display = popupVisible ? "flex" : "none";
    if (popupVisible) {
      systemStatusIndicator.style.background = "rgba(255,255,255,0.08)";
      systemStatusIndicator.style.transform = "scale(0.98)";
    } else {
      systemStatusIndicator.style.background = "";
      systemStatusIndicator.style.transform = "";
    }
  };

  // Fermer la popup quand on clique ailleurs
  document.addEventListener("click", (e) => {
    if (popupVisible && !systemStatusIndicator.contains(e.target as Node) && !systemStatusPopup.contains(e.target as Node)) {
      popupVisible = false;
      systemStatusPopup.style.display = "none";
      systemStatusIndicator.style.background = "";
      systemStatusIndicator.style.transform = "";
    }
  });

  // Indicateur système collé à droite (après les notifications)
  rightSection.appendChild(systemStatusIndicator);

  nav.appendChild(rightSection);
  document.body.appendChild(systemStatusPopup);

  // Mise à jour de l'indicateur d'état système en temps réel (import dynamique)
  import("../monitoring/systemHealth").then(({ systemHealthMonitor }) => {
    const updateStatusIndicator = (health: any) => {
      // Vérifier si on est sur une page d'organisation (fonction INDÉPENDANTE pour l'indicateur organisation)
      // Utiliser le flag orgIndicatorActive pour savoir si l'indicateur organisation est actif
      const isOrgIndicatorActive = systemStatusIndicator.dataset.orgIndicatorActive === "true";
      const orgStatus = systemStatusIndicator.dataset.orgStatus;
      const orgMessage = systemStatusIndicator.dataset.orgMessage;
      const orgDisplayName = systemStatusIndicator.dataset.orgDisplayName;
      
      // Si l'indicateur organisation est actif, utiliser ses données (fonction complètement séparée)
      // Sinon, utiliser le statut système global ICON (fonction séparée)
      const effectiveStatus = isOrgIndicatorActive && orgStatus ? 
        (orgStatus === "ok" ? "healthy" : "warning") : 
        health.status;
      const effectiveMessage = isOrgIndicatorActive && orgMessage ? orgMessage : health.message;
      
      // Couleurs distinctes selon le statut : vert clair, orange/ambre, rouge
      const statusColors = {
        healthy: { 
          bg: "rgba(78, 201, 176, 0.08)", 
          color: "#4ec9b0", // Vert clair/cyan
          border: "rgba(78, 201, 176, 0.2)", 
          icon: "✓", 
          hoverBg: "rgba(78, 201, 176, 0.15)" 
        },
        warning: { 
          bg: "rgba(245, 158, 11, 0.08)", 
          color: "#f59e0b", // Orange/ambre
          border: "rgba(245, 158, 11, 0.2)", 
          icon: "⚠", 
          hoverBg: "rgba(245, 158, 11, 0.15)" 
        },
        error: { 
          bg: "rgba(244, 135, 113, 0.08)", 
          color: "#f48771", // Rouge/corail
          border: "rgba(244, 135, 113, 0.2)", 
          icon: "✗", 
          hoverBg: "rgba(244, 135, 113, 0.15)" 
        }
      };
      const statusConfig = statusColors[effectiveStatus];
      
      // Mise à jour des styles et couleurs (style original avec point lumineux clignotant)
      systemStatusIndicator.style.background = statusConfig.bg;
      systemStatusIndicator.style.color = statusConfig.color;
      systemStatusIndicator.style.border = `1px solid ${statusConfig.border}`;
      systemStatusIndicator.title = effectiveMessage;
      
      // Style visuel original : point lumineux + texte simple avec "iCONTROL" ou nom de l'organisation
      // Si l'indicateur organisation est actif, utiliser orgDisplayName, sinon "iCONTROL" (ICON global)
      const currentText = isOrgIndicatorActive && orgDisplayName ? orgDisplayName : "iCONTROL";
      systemStatusIndicator.innerHTML = `<span>${currentText}</span>`;
      
      // Application des classes de statut pour les animations CSS (toujours clignotant, vitesse selon statut)
      systemStatusIndicator.classList.remove("status-healthy", "status-warning", "status-error");
      systemStatusIndicator.classList.add(`status-${effectiveStatus}`);
      
      // Effets hover interactifs (sauvegarder onclick existant)
      const existingOnClick = systemStatusIndicator.onclick;
      systemStatusIndicator.onmouseenter = () => {
        if (!popupVisible) {
          systemStatusIndicator.style.background = statusConfig.hoverBg;
          systemStatusIndicator.style.transform = "scale(1.05)";
          systemStatusIndicator.style.boxShadow = `0 2px 8px ${statusConfig.color}40`;
        }
      };
      systemStatusIndicator.onmouseleave = () => {
        if (!popupVisible) {
          systemStatusIndicator.style.background = statusConfig.bg;
          systemStatusIndicator.style.transform = "";
          systemStatusIndicator.style.boxShadow = "";
        }
      };
      // Réattacher onclick après la mise à jour
      systemStatusIndicator.onclick = existingOnClick;
      
      // Mise à jour de la popup avec détails
      systemStatusPopup.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--ic-border, #2b3136);">
          <div style="font-weight: 700; font-size: 14px; color: var(--ic-text, #e7ecef);">État du Système</div>
          <span style="padding: 4px 8px; background: ${statusConfig.bg}; color: ${statusConfig.color}; border: 1px solid ${statusConfig.border}; border-radius: 4px; font-size: 10px; font-weight: 600;">
            ${effectiveStatus === "healthy" ? "Opérationnel" : effectiveStatus === "warning" ? "Attention" : "Erreur"}
          </span>
        </div>
        <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 12px; line-height: 1.6; margin-bottom: 8px;">
          ${effectiveMessage}
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding-top: 8px; border-top: 1px solid var(--ic-border, #2b3136);">
          <div>
            <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; margin-bottom: 4px;">Mémoire</div>
            <div style="color: var(--ic-text, #e7ecef); font-weight: 600; font-size: 14px;">${health.details?.memory || 0}%</div>
          </div>
          <div>
            <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; margin-bottom: 4px;">CPU</div>
            <div style="color: var(--ic-text, #e7ecef); font-weight: 600; font-size: 14px;">${health.details?.cpu || 0}%</div>
          </div>
          <div>
            <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; margin-bottom: 4px;">Erreurs</div>
            <div style="color: var(--ic-text, #e7ecef); font-weight: 600; font-size: 14px;">${health.details?.errors || 0}</div>
          </div>
          <div>
            <div style="color: var(--ic-mutedText, #a7b0b7); font-size: 10px; margin-bottom: 4px;">Temps réponse</div>
            <div style="color: var(--ic-text, #e7ecef); font-weight: 600; font-size: 14px;">${health.details?.responseTime || 0}ms</div>
          </div>
        </div>
        <button class="icontrol-cp-status-action" style="margin-top: 8px; padding: 8px 12px; background: ${statusConfig.bg}; color: ${statusConfig.color}; border: 1px solid ${statusConfig.border}; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s;" onmouseenter="this.style.background='${statusConfig.hoverBg}';this.style.transform='scale(1.02)'" onmouseleave="this.style.background='${statusConfig.bg}';this.style.transform=''">
          Voir les détails →
        </button>
      `;
      const actionBtn = systemStatusPopup.querySelector(".icontrol-cp-status-action") as HTMLButtonElement | null;
      if (actionBtn) {
        actionBtn.onclick = () => navigate("#/verification");
      }
    };
    
    // Initialisation
    updateStatusIndicator(systemHealthMonitor.getCurrentHealth());
    
    // Abonnement aux mises à jour en temps réel
    systemHealthMonitor.subscribe(updateStatusIndicator);
  }).catch(() => {
    // Si le module n'est pas disponible, afficher quand même l'indicateur avec un statut par défaut
    // Ne pas masquer l'indicateur car il peut contenir des données d'organisation
    systemStatusIndicator.style.display = "";
    systemStatusIndicator.innerHTML = `<span>${systemStatusIndicator.dataset.displayName || "iCONTROL"}</span>`;
  });

  return nav;
}

/**
 * Crée la sidebar gauche
 */
function createSidebar(sections: CPSidebarSection[]): HTMLElement {
  const sidebar = document.createElement("div");
  sidebar.className = "icontrol-cp-sidebar icontrol-cp-sidebar-hidden";
  // Styles sont dans le CSS

  // Menu avec Dashboard, Utilisateurs, Management, Système, Abonnement, Organisation
  const menuItems = CP_NAV_ITEMS.filter((item) =>
    ["dashboard", "users", "management", "system", "subscription", "organization"].includes(item.id)
  ).map((item) => ({ id: item.id, label: item.label, hash: item.hash }));

  const currentHash = getCurrentHash() || "#/dashboard";

  menuItems.forEach((item) => {
    const isActive = currentHash === item.hash || (currentHash.startsWith("#/") && item.hash.startsWith("#/") && currentHash.split("?")[0] === item.hash.split("?")[0]);
    const itemDiv = document.createElement("div");
    itemDiv.className = `icontrol-cp-sidebar-item ${isActive ? "active" : ""}`;
    // Styles sont dans le CSS

    // Label
    const label = document.createElement("span");
    label.textContent = item.label;
    itemDiv.appendChild(label);

    itemDiv.onclick = () => {
      // Sur mobile, fermer le sidebar après clic
      if (window.innerWidth < 960) {
        sidebar.classList.add("icontrol-cp-sidebar-hidden");
        const overlay = document.querySelector(".icontrol-cp-sidebar-overlay") as HTMLElement;
        if (overlay) {
          overlay.style.display = "none";
        }
        // Remettre le burger à ☰
        const burger = document.querySelector(".icontrol-cp-burger") as HTMLElement;
        if (burger) {
          burger.innerHTML = "☰";
          burger.style.fontSize = "18px";
        }
      }
      navigate(item.hash);
    };

    sidebar.appendChild(itemDiv);
  });

  // Footer avec infos utilisateur
  const footer = createSidebarFooter();
  sidebar.appendChild(footer);

  return sidebar;
}

/**
 * Crée le footer de la sidebar avec Avatar (gauche) - Déconnexion (centre) - Paramètres (droite)
 */
function createSidebarFooter(): HTMLElement {
  const footer = document.createElement("div");
  footer.className = "icontrol-cp-sidebar-footer";
  footer.style.cssText = `
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--ic-border, #2b3136);
  `;

  if (!isLoggedIn()) {
    return footer;
  }

  const s = getSession() as any;
  if (!s) return footer;

  // Container pour Avatar (gauche) - Déconnexion (centre) - Paramètres (droite)
  const footerContainer = document.createElement("div");
  footerContainer.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 0;
  `;

  // Avatar (gauche)
  const avatar = document.createElement("div");
  avatar.id = "cp-sidebar-avatar";
  avatar.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    color: white;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform 0.2s;
  `;
  
  avatar.onmouseenter = () => {
    avatar.style.transform = "scale(1.1)";
  };
  avatar.onmouseleave = () => {
    avatar.style.transform = "scale(1)";
  };
  
  avatar.onclick = () => {
    navigate("#/account");
  };

  const avatarConfig = getAvatarConfig(s.username);
  if (avatarConfig.type === "image" && avatarConfig.imageUrl) {
    avatar.innerHTML = `<img src="${avatarConfig.imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${getInitials(s.username)}';this.parentElement.style.background='${avatarConfig.color || "#6D28D9"}';" />`;
    avatar.style.background = "transparent";
  } else {
    avatar.textContent = getInitials(s.username);
    avatar.style.background = avatarConfig.color || "#6D28D9";
  }

  // Bouton Déconnexion (centre)
  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Déconnexion";
  logoutBtn.style.cssText = `
    flex: 1;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  `;
  
  logoutBtn.onmouseenter = () => {
    logoutBtn.style.background = "rgba(255, 255, 255, 0.05)";
    logoutBtn.style.borderColor = "var(--ic-accent, #7b2cff)";
  };
  logoutBtn.onmouseleave = () => {
    logoutBtn.style.background = "transparent";
    logoutBtn.style.borderColor = "var(--ic-border, #2b3136)";
  };
  
  logoutBtn.onclick = () => {
    logout();
    navigate("#/login");
  };

  // Bouton Paramètres (droite)
  const settingsBtn = document.createElement("button");
  settingsBtn.innerHTML = "⚙️";
  settingsBtn.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  `;
  
  settingsBtn.onmouseenter = () => {
    settingsBtn.style.background = "rgba(255, 255, 255, 0.05)";
    settingsBtn.style.borderColor = "var(--ic-accent, #7b2cff)";
    settingsBtn.style.transform = "rotate(90deg)";
  };
  settingsBtn.onmouseleave = () => {
    settingsBtn.style.background = "transparent";
    settingsBtn.style.borderColor = "var(--ic-border, #2b3136)";
    settingsBtn.style.transform = "rotate(0deg)";
  };
  
  settingsBtn.onclick = () => {
    navigate("#/settings");
  };

  footerContainer.appendChild(avatar);
  footerContainer.appendChild(logoutBtn);
  footerContainer.appendChild(settingsBtn);

  footer.appendChild(footerContainer);

  return footer;
}
