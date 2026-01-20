/**
 * ICONTROL_TOAST_V1
 * Système de notifications toast avec liens vers audit
 */
import { navigate } from "/src/runtime/navigate";
export type ToastStatus = "success" | "warning" | "error" | "info";

export interface ToastConfig {
  status: ToastStatus;
  message: string;
  auditId?: string;
  duration?: number;
}

const TOAST_COLORS: Record<ToastStatus, { bg: string; border: string; icon: string }> = {
  success: { bg: "rgba(78,201,176,0.15)", border: "#4ec9b0", icon: "✅" },
  warning: { bg: "rgba(220,220,170,0.15)", border: "#dcdcaa", icon: "⚠️" },
  error: { bg: "rgba(244,135,113,0.15)", border: "#f48771", icon: "❌" },
  info: { bg: "rgba(123,44,255,0.15)", border: "#7b2cff", icon: "ℹ️" },
};

let toastContainer: HTMLElement | null = null;

function ensureToastContainer(): HTMLElement {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "icontrol-toast-container";
    toastContainer.setAttribute("style", `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `);
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(config: ToastConfig): void {
  const container = ensureToastContainer();
  const colors = TOAST_COLORS[config.status];
  const duration = config.duration || 5000;
  
  const toast = document.createElement("div");
  toast.style.minWidth = "0";
  toast.style.boxSizing = "border-box";
  toast.setAttribute("style", `
    padding: 16px 20px;
    background: ${colors.bg};
    border: 1px solid ${colors.border};
    border-left: 4px solid ${colors.border};
    border-radius: 8px;
    color: #d4d4d4;
    font-size: 14px;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
  `);
  
  toast.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <span style="font-size: 20px;">${colors.icon}</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">${config.message}</div>
        ${config.auditId ? `
          <a href="#/logs" data-action="view-logs" style="color: ${colors.border}; text-decoration: none; font-size: 12px; margin-top: 8px; display: inline-block;">
            Voir l'audit →
          </a>
        ` : ""}
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; border: none; color: #858585; cursor: pointer; font-size: 18px; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">×</button>
    </div>
    <style>
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  
  const logsLink = toast.querySelector('[data-action="view-logs"]') as HTMLAnchorElement | null;
  if (logsLink) {
    logsLink.onclick = (event) => {
      event.preventDefault();
      navigate("#/logs");
    };
  }

  container.appendChild(toast);
  
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "slideOut 0.3s ease-out";
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}
