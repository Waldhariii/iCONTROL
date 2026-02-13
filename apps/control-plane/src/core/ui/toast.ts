/**
 * ICONTROL_TOAST_V1
 * Système de notifications toast
 */
import { ICONTROL_KEYS } from "../runtime/storageKeys";
import { webStorage } from "../../platform/storage/webStorage";

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
  toastContainer.className = "ic-toast-container";
  document.body.appendChild(toastContainer);
  return toastContainer;
}

export function showToast(options: ToastOptions): void {
  try {
    const pref = webStorage.get(ICONTROL_KEYS.settings.notifications);
    if (pref === "off" || pref === "disabled") return;
  } catch {}
  const container = getToastContainer();
  const toast = document.createElement("div");
  toast.className = "ic-toast";
  toast.dataset["status"] = options.status;

  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };
  const iconSvg = icons[options.status] ?? icons.info;

  toast.style.animation = "icToastIn 0.3s ease-out";

  const iconWrap = document.createElement("span");
  iconWrap.className = "ic-toast__icon";
  iconWrap.innerHTML = iconSvg;
  const msg = document.createElement("span");
  msg.textContent = options.message;
  msg.className = "ic-toast__message";
  toast.appendChild(iconWrap);
  toast.appendChild(msg);

  // Add animation
  const style = document.createElement("style");
  if (!document.getElementById("icontrol-toast-animations")) {
    style.id = "icontrol-toast-animations";
    style.setAttribute("data-icontrol-allow", "1");
    style.textContent = `
      @keyframes icToastIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes icToastOut {
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
    toast.style.animation = "icToastOut 0.3s ease-out";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}
