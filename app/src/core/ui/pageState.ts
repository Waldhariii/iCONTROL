/**
 * ICONTROL_PAGE_STATE_V1
 * Composant standardisé pour les états de page (loading, empty, error)
 */
import { navigate } from "/src/runtime/navigate";
export type PageState = "loading" | "empty" | "error" | "success";

export interface PageStateConfig {
  state: PageState;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionCallback?: () => void;
  errorCode?: string;
  showRefresh?: boolean;
}

const STATE_STYLE = `
  padding: 40px 24px;
  text-align: center;
  border-radius: 12px;
  background: var(--ic-card, #1a1d1f);
  border: 1px solid var(--ic-border, #2b3136);
`;

const LOADING_STYLE = STATE_STYLE;
const EMPTY_STYLE = STATE_STYLE;
const ERROR_STYLE = STATE_STYLE + `border-left: 4px solid #f48771;`;

export function renderPageState(root: HTMLElement, config: PageStateConfig): void {
  root.innerHTML = "";

  if (config.state === "loading") {
    const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
    container.setAttribute("style", LOADING_STYLE);
    container.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
      <div style="font-size: 18px; font-weight: 600; color: #d4d4d4; margin-bottom: 8px;">
        ${config.title || "Chargement..."}
      </div>
      <div style="color: #858585; font-size: 14px;">
        ${config.message || "Veuillez patienter"}
      </div>
      <div style="margin-top: 20px; display: flex; justify-content: center; gap: 8px;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #4ec9b0; animation: pulse 1.5s ease-in-out infinite;"></div>
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #4ec9b0; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.2s;"></div>
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #4ec9b0; animation: pulse 1.5s ease-in-out infinite; animation-delay: 0.4s;"></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      </style>
    `;
    root.appendChild(container);
    return;
  }

  if (config.state === "empty") {
    const container = document.createElement("div");
    container.setAttribute("style", EMPTY_STYLE);
    container.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
      <div style="font-size: 18px; font-weight: 600; color: #d4d4d4; margin-bottom: 8px;">
        ${config.title || "Aucun contenu"}
      </div>
      <div style="color: #858585; font-size: 14px; margin-bottom: 20px;">
        ${config.message || "Il n'y a rien à afficher pour le moment."}
      </div>
      ${config.actionLabel && config.actionCallback ? `
        <button onclick="window.__pageStateAction?.()" style="padding: 10px 20px; background: #37373d; color: white; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer; font-weight: 600;">
          ${config.actionLabel}
        </button>
      ` : ""}
      ${config.showRefresh ? `
        <button onclick="location.reload()" style="margin-left: 12px; padding: 10px 20px; background: transparent; color: #858585; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer;">
          Rafraîchir
        </button>
      ` : ""}
    `;
    if (config.actionCallback) {
      (window as any).__pageStateAction = config.actionCallback;
    }
    root.appendChild(container);
    return;
  }

  if (config.state === "error") {
    const container = document.createElement("div");
    container.setAttribute("style", ERROR_STYLE);
    container.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <div style="font-size: 18px; font-weight: 600; color: #f48771; margin-bottom: 8px;">
        ${config.title || "Erreur"}
      </div>
      <div style="color: #858585; font-size: 14px; margin-bottom: 12px;">
        ${config.message || "Une erreur s'est produite."}
      </div>
      ${config.errorCode ? `
        <div style="color: #858585; font-size: 12px; font-family: monospace; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; margin-bottom: 16px;">
          Code: ${config.errorCode}
        </div>
      ` : ""}
      <div style="display: flex; gap: 12px; justify-content: center;">
        ${config.showRefresh ? `
          <button onclick="location.reload()" style="padding: 10px 20px; background: #37373d; color: white; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Rafraîchir
          </button>
        ` : ""}
        ${config.actionLabel && config.actionCallback ? `
          <button onclick="window.__pageStateAction?.()" style="padding: 10px 20px; background: transparent; color: #858585; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer;">
            ${config.actionLabel}
          </button>
        ` : ""}
        <button data-action="view-logs" style="padding: 10px 20px; background: transparent; color: #858585; border: 1px solid #3e3e3e; border-radius: 8px; cursor: pointer;">
          Voir les logs
        </button>
      </div>
    `;
    if (config.actionCallback) {
      (window as any).__pageStateAction = config.actionCallback;
    }
    const logsBtn = container.querySelector('[data-action="view-logs"]') as HTMLButtonElement | null;
    if (logsBtn) {
      logsBtn.onclick = () => navigate("#/management");
    }
    root.appendChild(container);
    return;
  }
}
