/**
 * ICONTROL_RISK_CONFIRM_MODAL_V1
 * Modal de confirmation renforcée pour actions à haut risque
 */
export interface RiskConfirmConfig {
  title: string;
  message: string;
  impactSummary: string[];
  affectedItems?: string[];
  confirmText?: string; // Texte à taper pour confirmer
  onConfirm: () => void;
  onCancel?: () => void;
  riskLevel: "low" | "medium" | "high";
}

const RISK_COLORS = {
  low: { bg: "rgba(78,201,176,0.15)", border: "#4ec9b0", icon: "🟢" },
  medium: { bg: "rgba(220,220,170,0.15)", border: "#dcdcaa", icon: "🟠" },
  high: { bg: "rgba(244,135,113,0.15)", border: "#f48771", icon: "🔴" },
};

export function showRiskConfirmModal(config: RiskConfirmConfig): void {
  const overlay = document.createElement("div");
  overlay.style.minWidth = "0";
  overlay.style.boxSizing = "border-box";
  overlay.setAttribute("style", `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  `);
  
  const colors = RISK_COLORS[config.riskLevel];
  const confirmText = config.confirmText || "CONFIRMER";
  
  const modal = document.createElement("div");
  modal.setAttribute("style", `
    background: #1e1e1e;
    border: 2px solid ${colors.border};
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    width: 100%;
    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    animation: slideUp 0.3s ease-out;
  `);
  
  let confirmInput: HTMLInputElement | null = null;
  
  modal.innerHTML = `
    <div style="display: flex; align-items: start; gap: 16px; margin-bottom: 20px;">
      <span style="font-size: 32px;">${colors.icon}</span>
      <div style="flex: 1;">
        <h2 style="margin: 0 0 8px 0; color: ${colors.border}; font-size: 20px; font-weight: 700;">
          ${config.title}
        </h2>
        <p style="margin: 0; color: #d4d4d4; font-size: 14px; line-height: 1.5;">
          ${config.message}
        </p>
      </div>
    </div>
    
    ${config.impactSummary.length > 0 ? `
      <div style="background: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-weight: 600; color: ${colors.border}; margin-bottom: 12px; font-size: 13px;">
          RÉSUMÉ D'IMPACT
        </div>
        <ul style="margin: 0; padding-left: 20px; color: #d4d4d4; font-size: 13px; line-height: 1.8;">
          ${config.impactSummary.map(item => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    ` : ""}
    
    ${config.affectedItems && config.affectedItems.length > 0 ? `
      <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-weight: 600; color: #858585; margin-bottom: 8px; font-size: 12px;">
          ÉLÉMENTS AFFECTÉS
        </div>
        <div style="color: #d4d4d4; font-size: 12px; font-family: monospace;">
          ${config.affectedItems.join(", ")}
        </div>
      </div>
    ` : ""}
    
    ${config.riskLevel === "high" ? `
      <div style="margin-bottom: 20px;">
        <label style="display: block; color: #858585; font-size: 12px; margin-bottom: 8px; font-weight: 600;">
          Tapez "${confirmText}" pour confirmer :
        </label>
        <input 
          type="text" 
          id="riskConfirmInput"
          style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #3e3e3e; background: #121212; color: #d4d4d4; font-size: 14px; font-family: monospace;"
          placeholder="${confirmText}"
          autocomplete="off"
        />
      </div>
    ` : ""}
    
    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
      <button id="riskCancelBtn" style="padding: 10px 20px; background: transparent; color: #858585; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Annuler
      </button>
      <button id="riskConfirmBtn" style="padding: 10px 20px; background: ${colors.bg}; color: ${colors.border}; border: 1px solid ${colors.border}; border-radius: 8px; cursor: pointer; font-weight: 700; opacity: 0.5;" disabled>
        ${config.riskLevel === "high" ? "Confirmer" : "Continuer"}
      </button>
    </div>
    
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  confirmInput = modal.querySelector("#riskConfirmInput") as HTMLInputElement;
  const confirmBtn = modal.querySelector("#riskConfirmBtn") as HTMLButtonElement;
  const cancelBtn = modal.querySelector("#riskCancelBtn") as HTMLButtonElement;
  
  const close = () => {
    overlay.style.animation = "fadeOut 0.2s ease-out";
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    }, 200);
  };
  
  const checkConfirm = () => {
    if (config.riskLevel === "high" && confirmInput) {
      const isValid = confirmInput.value.trim() === confirmText;
      confirmBtn.disabled = !isValid;
      confirmBtn.style.opacity = isValid ? "1" : "0.5";
    } else {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
    }
  };
  
  if (confirmInput) {
    confirmInput.addEventListener("input", checkConfirm);
    confirmInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !confirmBtn.disabled) {
        confirmBtn.click();
      }
    });
    confirmInput.focus();
  }
  
  confirmBtn.onclick = () => {
    if (!confirmBtn.disabled) {
      config.onConfirm();
      close();
    }
  };
  
  cancelBtn.onclick = () => {
    if (config.onCancel) config.onCancel();
    close();
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      close();
    }
  };
  
  // ESC pour fermer
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}
