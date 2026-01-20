/**
 * ICONTROL_ACTION_BUTTON_V1
 * Boutons avec hiérarchie visuelle et niveau de risque
 */
export type ButtonHierarchy = "primary" | "secondary" | "tertiary" | "danger";
export type RiskLevel = "low" | "medium" | "high";

export interface ActionButtonConfig {
  label: string;
  hierarchy?: ButtonHierarchy;
  riskLevel?: RiskLevel;
  disabled?: boolean;
  disabledReason?: string;
  requiresConfirm?: boolean;
  onClick: () => void;
  icon?: string;
}

const HIERARCHY_STYLES: Record<ButtonHierarchy, string> = {
  primary: "background:#37373d;color:white;font-weight:700;border:1px solid #3e3e3e;",
  secondary: "background:rgba(255,255,255,0.05);color:#d4d4d4;font-weight:600;border:1px solid #3e3e3e;",
  tertiary: "background:transparent;color:#858585;font-weight:500;border:1px solid #3e3e3e;",
  danger: "background:rgba(244,135,113,0.15);color:#f48771;font-weight:700;border:1px solid #f48771;",
};

const RISK_ICONS: Record<RiskLevel, string> = {
  low: "🟢",
  medium: "🟠",
  high: "🔴",
};

export function createActionButton(config: ActionButtonConfig): HTMLButtonElement {
  const btn = document.createElement("button");
  const hierarchy = config.hierarchy || "secondary";
  const baseStyle = `
    padding: 10px 16px;
    border-radius: 8px;
    cursor: ${config.disabled ? "not-allowed" : "pointer"};
    font-size: 14px;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    opacity: ${config.disabled ? 0.5 : 1};
    ${HIERARCHY_STYLES[hierarchy]}
  `;
  
  btn.setAttribute("style", baseStyle);
  
  if (config.icon) {
    btn.innerHTML = `<span>${config.icon}</span> ${config.label}`;
  } else {
    btn.textContent = config.label;
  }
  
  if (config.riskLevel && !config.disabled) {
    const riskIcon = RISK_ICONS[config.riskLevel];
    btn.innerHTML = `${riskIcon} ${btn.innerHTML || config.label}`;
    btn.setAttribute("title", `Niveau de risque: ${config.riskLevel === "high" ? "Élevé" : config.riskLevel === "medium" ? "Moyen" : "Faible"}`);
  }
  
  if (config.disabled && config.disabledReason) {
    btn.setAttribute("title", `Désactivé: ${config.disabledReason}`);
  }
  
  btn.onclick = (e) => {
    e.preventDefault();
    if (config.disabled) return;
    
    if (config.requiresConfirm) {
      const riskMsg = config.riskLevel === "high" 
        ? "Cette action est à haut risque. " 
        : config.riskLevel === "medium" 
        ? "Cette action peut avoir un impact. " 
        : "";
      const confirmed = confirm(`${riskMsg}Confirmer: ${config.label}?`);
      if (!confirmed) return;
    }
    
    config.onClick();
  };
  
  return btn;
}
