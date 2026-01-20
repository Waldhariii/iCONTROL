import type { SystemModel } from "../model";
import { blockKeyValueTable } from "../../../shared/uiBlocks";
import { addTooltipToElement } from "/src/core/ui/tooltip";
import { getSafeMode } from "/src/core/runtime/safe";

// Historique des changements SAFE_MODE
type SafeModeHistoryEntry = {
  id: string;
  timestamp: string;
  from: "STRICT" | "COMPAT";
  to: "STRICT" | "COMPAT";
  user: string;
  reason?: string;
};

const HISTORY_KEY = "icontrol_safemode_history_v1";
const MAX_HISTORY = 20;

function getSafeModeHistory(): SafeModeHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.slice(-MAX_HISTORY);
    }
  } catch {}
  return [];
}

function saveSafeModeHistory(entry: SafeModeHistoryEntry): void {
  try {
    const history = getSafeModeHistory();
    history.push(entry);
    const trimmed = history.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde de l'historique SAFE_MODE:", e);
  }
}

function getPreviousSafeMode(): "STRICT" | "COMPAT" | null {
  const history = getSafeModeHistory();
  if (history.length === 0) return null;
  return history[history.length - 1].from;
}

export function renderSystemSafeMode(host: HTMLElement, model: SystemModel): void {
  const currentMode = model.safeMode;
  const isStrict = currentMode === "STRICT";
  
  // Container principal
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = "display: flex; flex-direction: column; gap: 16px;";
  
  // Carte État actuel
  const statusCard = document.createElement("div");
  statusCard.style.cssText = `
    padding: 16px;
    background: var(--ic-card, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
  `;
  
  const statusBg = isStrict ? "rgba(244, 135, 113, 0.1)" : "rgba(78, 201, 176, 0.1)";
  const statusBorder = isStrict ? "#f48771" : "#4ec9b0";
  const statusColor = isStrict ? "#f48771" : "#4ec9b0";
  const statusIcon = isStrict ? "🔒 STRICT" : "🔓 COMPAT";
  const statusText = isStrict ? "Mode Strict Activé" : "Mode Compatible Activé";
  
  statusCard.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div>
        <div style="font-size: 18px; font-weight: 700; color: ${statusColor}; margin-bottom: 4px;">
          ${statusIcon}
        </div>
        <div style="font-size: 14px; color: var(--ic-text, #e7ecef); font-weight: 600;">
          ${statusText}
        </div>
      </div>
      <div style="padding: 8px 16px; background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 6px;">
        <span style="color: ${statusColor}; font-weight: 700; font-size: 14px;">${currentMode}</span>
      </div>
    </div>
  `;
  
  // Explications des niveaux
  const explanationsCard = document.createElement("div");
  explanationsCard.style.cssText = `
    padding: 16px;
    background: var(--ic-card, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
  `;
  
  explanationsCard.innerHTML = `
    <div style="font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef); margin-bottom: 12px;">
      Explications des niveaux SAFE_MODE
    </div>
    <div style="display: grid; gap: 12px;">
      <div style="padding: 12px; background: rgba(78, 201, 176, 0.05); border-left: 3px solid #4ec9b0; border-radius: 4px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 18px;">🔓</span>
          <span style="font-weight: 600; color: #4ec9b0;">COMPAT (Compatible)</span>
        </div>
        <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7); line-height: 1.5;">
          Mode par défaut. Toutes les fonctionnalités sont actives. Les opérations d'écriture sont autorisées. 
          Les restrictions légères peuvent s'appliquer selon la configuration.
        </div>
      </div>
      <div style="padding: 12px; background: rgba(244, 135, 113, 0.05); border-left: 3px solid #f48771; border-radius: 4px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 18px;">🔒</span>
          <span style="font-weight: 600; color: #f48771;">STRICT (Strict)</span>
        </div>
        <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7); line-height: 1.5;">
          Mode de sécurité maximale. Les opérations d'écriture sont bloquées. Certaines fonctionnalités peuvent être désactivées.
          Utile pour protéger les données critiques ou en cas de maintenance.
        </div>
      </div>
    </div>
  `;
  
  // Bouton Dry-run (Simuler changement)
  const dryRunCard = document.createElement("div");
  dryRunCard.style.cssText = `
    padding: 16px;
    background: var(--ic-card, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
  `;
  
  const dryRunBtn = document.createElement("button");
  dryRunBtn.textContent = "🧪 Simuler changement SAFE_MODE";
  dryRunBtn.style.cssText = `
    width: 100%;
    padding: 12px;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 1px solid #3b82f6;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    transition: all 0.2s;
  `;
  dryRunBtn.onmouseenter = () => {
    dryRunBtn.style.background = "rgba(59, 130, 246, 0.2)";
  };
  dryRunBtn.onmouseleave = () => {
    dryRunBtn.style.background = "rgba(59, 130, 246, 0.1)";
  };
  dryRunBtn.onclick = () => {
    const targetMode = isStrict ? "COMPAT" : "STRICT";
    showDryRunPreview(currentMode, targetMode as "STRICT" | "COMPAT");
  };
  
  dryRunCard.appendChild(dryRunBtn);
  
  // Bouton Rollback urgence (rouge bien visible)
  const previousMode = getPreviousSafeMode();
  if (previousMode && previousMode !== currentMode) {
    const rollbackCard = document.createElement("div");
    rollbackCard.style.cssText = `
      padding: 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 2px solid #ef4444;
      border-radius: 8px;
    `;
    
    const rollbackBtn = document.createElement("button");
    rollbackBtn.textContent = `🚨 Restaurer configuration précédente (${previousMode})`;
    rollbackBtn.style.cssText = `
      width: 100%;
      padding: 14px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    `;
    rollbackBtn.onmouseenter = () => {
      rollbackBtn.style.background = "#dc2626";
      rollbackBtn.style.transform = "scale(1.02)";
    };
    rollbackBtn.onmouseleave = () => {
      rollbackBtn.style.background = "#ef4444";
      rollbackBtn.style.transform = "scale(1)";
    };
    rollbackBtn.onclick = () => {
      showRollbackConfirm(previousMode);
    };
    
    rollbackCard.appendChild(rollbackBtn);
    container.appendChild(rollbackCard);
  }
  
  // Historique des changements
  const historyCard = document.createElement("div");
  historyCard.style.cssText = `
    padding: 16px;
    background: var(--ic-card, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
  `;
  
  const history = getSafeModeHistory();
  historyCard.innerHTML = `
    <div style="font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef); margin-bottom: 12px;">
      Historique des changements (${history.length} entrée${history.length > 1 ? "s" : ""})
    </div>
    <div id="safemode-history-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
      ${history.length === 0 ? `
        <div style="text-align: center; padding: 20px; color: var(--ic-mutedText, #a7b0b7); font-size: 12px;">
          Aucun historique disponible
        </div>
      ` : history.slice().reverse().map(entry => `
        <div style="padding: 10px; background: rgba(255,255,255,0.02); border-left: 3px solid ${entry.to === "STRICT" ? "#f48771" : "#4ec9b0"}; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 600; color: var(--ic-text, #e7ecef); font-size: 13px;">
              ${entry.from} → ${entry.to}
            </span>
            <span style="font-size: 11px; color: var(--ic-mutedText, #a7b0b7);">
              ${new Date(entry.timestamp).toLocaleString('fr-FR')}
            </span>
          </div>
          <div style="font-size: 11px; color: var(--ic-mutedText, #a7b0b7);">
            Par: ${entry.user}${entry.reason ? ` • ${entry.reason}` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
  
  container.appendChild(statusCard);
  container.appendChild(explanationsCard);
  container.appendChild(dryRunCard);
  if (previousMode && previousMode !== currentMode) {
    container.appendChild(rollbackCard);
  }
  container.appendChild(historyCard);
  host.appendChild(container);
  
  // Ajouter tooltips sur les badges de niveau
  const compatBadge = explanationsCard.querySelector('[style*="COMPAT"]') as HTMLElement;
  const strictBadge = explanationsCard.querySelector('[style*="STRICT"]') as HTMLElement;
  if (compatBadge) {
    addTooltipToElement(compatBadge, "Mode compatible: toutes les fonctionnalités actives, opérations d'écriture autorisées", "top");
  }
  if (strictBadge) {
    addTooltipToElement(strictBadge, "Mode strict: sécurité maximale, opérations d'écriture bloquées, certaines fonctionnalités désactivées", "top");
  }
}

// Fonction pour afficher le preview Dry-run
function showDryRunPreview(current: "STRICT" | "COMPAT", target: "STRICT" | "COMPAT"): void {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: var(--ic-panel, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  `;
  
  const impacts = target === "STRICT" 
    ? [
        "Les opérations d'écriture seront bloquées",
        "Les fonctionnalités de modification seront désactivées",
        "Les flags système critiques seront verrouillés",
        "Les logs d'audit seront renforcés"
      ]
    : [
        "Les opérations d'écriture seront autorisées",
        "Toutes les fonctionnalités seront disponibles",
        "Les flags système pourront être modifiés",
        "Mode normal restauré"
      ];
  
  modalContent.innerHTML = `
    <div style="font-size: 18px; font-weight: 700; color: var(--ic-text, #e7ecef); margin-bottom: 20px;">
      🧪 Simulation: Changement SAFE_MODE
    </div>
    <div style="padding: 16px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 20px;">
      <div style="font-weight: 600; color: #3b82f6; margin-bottom: 8px;">
        ${current} → ${target}
      </div>
      <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">
        Prévisualisation des impacts sans appliquer les changements
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <div style="font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef); margin-bottom: 12px;">
        Impacts prévus:
      </div>
      <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;">
        ${impacts.map(impact => `
          <li style="padding: 8px; background: rgba(255,255,255,0.02); border-radius: 4px; font-size: 13px; color: var(--ic-text, #e7ecef);">
            • ${impact}
          </li>
        `).join("")}
      </ul>
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="cancel-dryrun" style="padding: 10px 20px; background: rgba(255,255,255,0.05); color: var(--ic-text, #e7ecef); border: 1px solid var(--ic-border, #2b3136); border-radius: 8px; cursor: pointer; font-weight: 600;">
        Fermer
      </button>
      <button id="apply-change" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Appliquer le changement
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  
  modalContent.querySelector("#cancel-dryrun")?.addEventListener("click", closeModal);
  modalContent.querySelector("#apply-change")?.addEventListener("click", async () => {
    // Appeler la fonction de changement SAFE_MODE (à implémenter dans safe-mode-actions.ts)
    (globalThis as any).ICONTROL_SAFE_MODE = target;
    try {
      const { requireSession } = await import("/src/localAuth");
      const s = requireSession();
      saveSafeModeHistory({
        id: `sm-${Date.now()}`,
        timestamp: new Date().toISOString(),
        from: current,
        to: target,
        user: s.username || "System"
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
      saveSafeModeHistory({
        id: `sm-${Date.now()}`,
        timestamp: new Date().toISOString(),
        from: current,
        to: target,
        user: "System"
      });
    }
    closeModal();
    location.reload();
  });
  
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

// Fonction pour confirmer le rollback
function showRollbackConfirm(targetMode: "STRICT" | "COMPAT"): void {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: var(--ic-panel, #1a1d1f);
    border: 2px solid #ef4444;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 100%;
  `;
  
  modalContent.innerHTML = `
    <div style="font-size: 18px; font-weight: 700; color: #ef4444; margin-bottom: 16px;">
      🚨 Restauration d'urgence
    </div>
    <div style="color: var(--ic-text, #e7ecef); margin-bottom: 20px; line-height: 1.6;">
      Êtes-vous sûr de vouloir restaurer la configuration SAFE_MODE précédente ?
      <br><br>
      <strong style="color: #ef4444;">${getSafeMode()} → ${targetMode}</strong>
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="cancel-rollback" style="padding: 10px 20px; background: rgba(255,255,255,0.05); color: var(--ic-text, #e7ecef); border: 1px solid var(--ic-border, #2b3136); border-radius: 8px; cursor: pointer; font-weight: 600;">
        Annuler
      </button>
      <button id="confirm-rollback" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700;">
        Confirmer la restauration
      </button>
    </div>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  
  modalContent.querySelector("#cancel-rollback")?.addEventListener("click", closeModal);
  modalContent.querySelector("#confirm-rollback")?.addEventListener("click", async () => {
    const current = getSafeMode();
    (globalThis as any).ICONTROL_SAFE_MODE = targetMode;
    const { requireSession } = await import("/src/localAuth");
    const s = requireSession();
    saveSafeModeHistory({
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: current,
      to: targetMode,
      user: s.username || "System",
      reason: "Rollback urgence"
    });
    closeModal();
    location.reload();
  });
  
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}
