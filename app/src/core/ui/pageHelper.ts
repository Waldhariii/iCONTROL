/**
 * ICONTROL_PAGE_HELPER_V1
 * Helper réutilisable pour standardiser la structure et les fonctions de toutes les pages CP
 */

import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";

export interface PageConfig {
  title: string;
  description?: string;
  icon?: string;
}

export interface PageStructure {
  root: HTMLElement;
  wrap: HTMLElement;
  card: HTMLElement;
  cardContent: HTMLElement;
  infoDiv: HTMLElement;
}

/**
 * Crée la structure de base standardisée pour toutes les pages CP
 */
export function createStandardPageStructure(root: HTMLElement, config: PageConfig): PageStructure {
  // Injecter les styles de base
  root.innerHTML = coreBaseStyles();

  // Container principal
  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.className = "cxWrap";
  wrap.setAttribute("style", `
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: 0;
    gap: 20px;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
    background: transparent;
    min-height: auto;
  `);

  // Créer le panneau principal
  const panelResult = createToolboxPanelElement(
    config.title,
    config.description || ""
  );
  const card = panelResult.panel;
  const cardContent = panelResult.content;

  // Ajouter l'icône dans le header si fournie
  if (config.icon) {
    const headerTitleDiv = card.querySelector(".icontrol-panel-header > div");
    if (headerTitleDiv) {
      const iconSpan = document.createElement("span");
      iconSpan.textContent = config.icon;
      iconSpan.style.cssText = "font-size:18px;margin-right:8px;";
      headerTitleDiv.parentElement?.insertBefore(iconSpan, headerTitleDiv);
    }
  }

  // Créer le bloc d'information standard
  const s = requireSession();
  const infoDiv = document.createElement("div");
  infoDiv.style.cssText = `
    padding: 14px;
    border: 1px solid var(--ic-border, var(--line));
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    display: grid;
    gap: 8px;
    margin-bottom: 20px;
  `;
  infoDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <span style="color:var(--ic-mutedText, var(--muted));">Application</span>
      <span style="font-weight:600;color:var(--ic-text, var(--text));">Administration (CP)</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <span style="color:var(--ic-mutedText, var(--muted));">Administrateur actuel</span>
      <span style="font-weight:600;color:var(--ic-text, var(--text));">${s.username} <span style="color:var(--ic-accent, var(--accent));">(${s.username === "Master" ? "Master" : s.role})</span></span>
    </div>
  `;

  // Assembler la structure
  cardContent.appendChild(infoDiv);
  wrap.appendChild(card);
  root.appendChild(wrap);

  return {
    root,
    wrap,
    card,
    cardContent,
    infoDiv
  };
}

/**
 * Style standard pour les cartes/sections secondaires
 */
export const SECONDARY_CARD_STYLE = `
  padding: 16px;
  border: 1px solid var(--ic-border, #2b3136);
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

/**
 * Style standard pour les boutons principaux
 */
export const PRIMARY_BUTTON_STYLE = `
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--ic-accent, #7b2cff);
  background: var(--ic-accent, #7b2cff);
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
`;

/**
 * Style standard pour les boutons secondaires
 */
export const SECONDARY_BUTTON_STYLE = `
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--ic-border, #2b3136);
  background: transparent;
  color: var(--ic-text, #e7ecef);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
`;

/**
 * Style standard pour les inputs
 */
export const INPUT_STYLE = `
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--ic-border, #2b3136);
  background: #252526;
  color: var(--ic-text, #e7ecef);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
`;

/**
 * Style standard pour les labels
 */
export const LABEL_STYLE = `
  display: block;
  color: var(--ic-mutedText, #a7b0b7);
  font-size: 13px;
  margin-bottom: 6px;
  font-weight: 600;
`;

/**
 * Style standard pour les sections de statistiques
 */
export const STATS_CARD_STYLE = `
  padding: 16px;
  border: 1px solid var(--ic-border, #2b3136);
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/**
 * Style standard pour les badges de statut
 */
export function getStatusBadgeStyle(status: "active" | "inactive" | "warning" | "error" | "info"): string {
  const styles = {
    active: "background:rgba(78,201,176,0.15);color:#4ec9b0;border:1px solid rgba(78,201,176,0.3);",
    inactive: "background:rgba(132,132,132,0.15);color:#848484;border:1px solid rgba(132,132,132,0.3);",
    warning: "background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);",
    error: "background:rgba(244,135,113,0.15);color:#f48771;border:1px solid rgba(244,135,113,0.3);",
    info: "background:rgba(59,130,246,0.15);color:#3b82f6;border:1px solid rgba(59,130,246,0.3);"
  };
  return `
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    ${styles[status]}
  `;
}

/**
 * Crée un badge de statut standardisé
 */
export function createStatusBadge(
  label: string,
  status: "active" | "inactive" | "warning" | "error" | "info"
): HTMLElement {
  const badge = document.createElement("span");
  badge.textContent = label;
  badge.style.cssText = getStatusBadgeStyle(status);
  return badge;
}

/**
 * Style standard pour les tooltips
 */
export function addStandardTooltip(element: HTMLElement, content: string): void {
  element.setAttribute("title", content);
  element.setAttribute("aria-label", content);
}
