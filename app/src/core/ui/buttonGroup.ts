/**
 * ICONTROL_BUTTON_GROUP_V1
 * Groupe de boutons réutilisable
 */

export interface ButtonGroupButton {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export interface ButtonGroupOptions {
  buttons: ButtonGroupButton[];
  vertical?: boolean;
  size?: "small" | "medium" | "large";
}

export function createButtonGroup(options: ButtonGroupOptions): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = `
    display: flex;
    flex-direction: ${options.vertical ? "column" : "row"};
    gap: 0;
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
    overflow: hidden;
    width: fit-content;
  `;

  const padding = options.size === "small" ? "6px 12px" : options.size === "large" ? "12px 20px" : "10px 16px";
  const fontSize = options.size === "small" ? "11px" : options.size === "large" ? "14px" : "13px";

  options.buttons.forEach((btn, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.id = btn.id;
    button.disabled = btn.disabled || false;

    if (btn.icon) {
      button.innerHTML = `<span style="margin-right: 6px;">${btn.icon}</span>${btn.label}`;
    } else {
      button.textContent = btn.label;
    }

    const isActive = btn.active || false;
    const isFirst = index === 0;
    const isLast = index === options.buttons.length - 1;

    button.style.cssText = `
      padding: ${padding};
      background: ${isActive ? "var(--ic-panel, #37373d)" : "transparent"};
      border: none;
      border-right: ${!options.vertical && !isLast ? "1px solid var(--ic-border, #2b3136)" : "none"};
      border-bottom: ${options.vertical && !isLast ? "1px solid var(--ic-border, #2b3136)" : "none"};
      color: ${isActive ? "var(--ic-text, #e7ecef)" : "var(--ic-mutedText, #a7b0b7)"};
      font-size: ${fontSize};
      font-weight: ${isActive ? "600" : "500"};
      cursor: ${btn.disabled ? "not-allowed" : "pointer"};
      transition: all 0.2s;
      white-space: nowrap;
    `;

    if (!btn.disabled) {
      button.onmouseenter = () => {
        if (!isActive) {
          button.style.background = "rgba(255,255,255,0.05)";
        }
      };
      button.onmouseleave = () => {
        if (!isActive) {
          button.style.background = "transparent";
        }
      };
      button.onclick = () => {
        // Désactiver tous les autres
        options.buttons.forEach(b => b.active = false);
        btn.active = true;
        
        // Mettre à jour les styles
        container.querySelectorAll("button").forEach((b, i) => {
          const btnConfig = options.buttons[i];
          const active = btnConfig.active || false;
          b.style.background = active ? "var(--ic-panel, #37373d)" : "transparent";
          b.style.color = active ? "var(--ic-text, #e7ecef)" : "var(--ic-mutedText, #a7b0b7)";
          b.style.fontWeight = active ? "600" : "500";
        });

        btn.onClick();
      };
    }

    container.appendChild(button);
  });

  return container;
}
