/**
 * ICONTROL_ALERT_V1
 * Alerte réutilisable (Success, Error, Warning, Info)
 */

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertOptions {
  type: AlertType;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: string;
}

export function createAlert(options: AlertOptions): HTMLElement {
  const colors = {
    success: {
      bg: "rgba(78,201,176,0.15)",
      border: "#4ec9b0",
      text: "#4ec9b0",
      icon: "✅"
    },
    error: {
      bg: "rgba(244,135,113,0.15)",
      border: "#f48771",
      text: "#f48771",
      icon: "❌"
    },
    warning: {
      bg: "rgba(220,220,170,0.15)",
      border: "#dcdcaa",
      text: "#dcdcaa",
      icon: "⚠️"
    },
    info: {
      bg: "rgba(59,130,246,0.15)",
      border: "#3b82f6",
      text: "#3b82f6",
      icon: "ℹ️"
    }
  };

  const color = colors[options.type];
  const icon = options.icon || color.icon;

  const alert = document.createElement("div");
  alert.style.minWidth = "0";
  alert.style.boxSizing = "border-box";
  alert.style.cssText = `
    padding: 12px 16px;
    background: ${color.bg};
    border: 1px solid ${color.border};
    border-left: 4px solid ${color.border};
    border-radius: 6px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  `;

  const iconSpan = document.createElement("span");
  iconSpan.style.cssText = "font-size: 18px; flex-shrink: 0;";
  iconSpan.textContent = icon;
  alert.appendChild(iconSpan);

  const content = document.createElement("div");
  content.style.cssText = "flex: 1; display: flex; flex-direction: column; gap: 4px;";

  if (options.title) {
    const title = document.createElement("div");
    title.style.cssText = `color: ${color.text}; font-size: 14px; font-weight: 600;`;
    title.textContent = options.title;
    content.appendChild(title);
  }

  const message = document.createElement("div");
  message.style.cssText = `color: var(--ic-text, #e7ecef); font-size: 13px; line-height: 1.5;`;
  message.textContent = options.message;
  content.appendChild(message);

  alert.appendChild(content);

  if (options.dismissible !== false) {
    const dismissBtn = document.createElement("button");
    dismissBtn.innerHTML = "×";
    dismissBtn.style.cssText = `
      background: transparent;
      border: none;
      color: ${color.text};
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      opacity: 0.7;
      transition: opacity 0.2s;
    `;
    dismissBtn.onmouseenter = () => { dismissBtn.style.opacity = "1"; };
    dismissBtn.onmouseleave = () => { dismissBtn.style.opacity = "0.7"; };
    dismissBtn.onclick = () => {
      alert.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => {
        if (options.onDismiss) options.onDismiss();
        alert.remove();
      }, 300);
    };
    alert.appendChild(dismissBtn);
  }

  if (!document.getElementById("alert-styles")) {
    const style = document.createElement("style");
    style.id = "alert-styles";
    style.textContent = `
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  return alert;
}
