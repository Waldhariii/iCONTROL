/**
 * ICONTROL_TOAST_V1
 * Système de notifications toast
 */

export interface ToastOptions {
  status: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

let toastContainer: HTMLElement | null = null;

function getToastContainer(): HTMLElement {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }

  toastContainer = document.createElement("div");
  toastContainer.id = "icontrol-toast-container";
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

export function showToast(options: ToastOptions): void {
  const container = getToastContainer();
  const toast = document.createElement("div");
  
  const statusColors = {
    success: { bg: "rgba(76, 175, 80, 0.15)", border: "rgba(76, 175, 80, 0.5)", text: "#4caf50" },
    error: { bg: "rgba(244, 67, 54, 0.15)", border: "rgba(244, 67, 54, 0.5)", text: "#f44336" },
    warning: { bg: "rgba(255, 152, 0, 0.15)", border: "rgba(255, 152, 0, 0.5)", text: "#ff9800" },
    info: { bg: "rgba(33, 150, 243, 0.15)", border: "rgba(33, 150, 243, 0.5)", text: "#2196f3" },
  };

  const colors = statusColors[options.status] || statusColors.info;

  toast.style.cssText = `
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid ${colors.border};
    background: ${colors.bg};
    color: ${colors.text};
    font-size: 13px;
    font-weight: 500;
    min-width: 200px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
  `;

  toast.textContent = options.message;

  // Add animation
  const style = document.createElement("style");
  if (!document.getElementById("icontrol-toast-animations")) {
    style.id = "icontrol-toast-animations";
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  const duration = options.duration || 3000;
  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}
