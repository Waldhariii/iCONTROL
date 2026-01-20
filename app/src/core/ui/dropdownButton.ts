/**
 * ICONTROL_DROPDOWN_BUTTON_V1
 * Bouton avec menu déroulant
 */

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownButtonOptions {
  label: string;
  icon?: string;
  items: DropdownMenuItem[];
  position?: "left" | "right" | "bottom-left" | "bottom-right";
}

export function createDropdownButton(options: DropdownButtonOptions): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = "position: relative; display: inline-block;";

  const button = document.createElement("button");
  button.type = "button";
  button.style.cssText = `
    padding: 10px 16px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  `;

  if (options.icon) {
    button.innerHTML = `<span>${options.icon}</span><span>${options.label}</span><span style="font-size: 10px;">▼</span>`;
  } else {
    button.innerHTML = `${options.label} <span style="font-size: 10px; margin-left: 4px;">▼</span>`;
  }

  button.onmouseenter = () => {
    button.style.background = "#4a4a50";
  };
  button.onmouseleave = () => {
    button.style.background = "var(--ic-panel, #37373d)";
  };

  const menu = document.createElement("div");
  menu.style.cssText = `
    position: absolute;
    ${options.position === "right" || options.position === "bottom-right" ? "right: 0;" : "left: 0;"}
    ${options.position === "bottom-left" || options.position === "bottom-right" ? "top: 100%; margin-top: 4px;" : "bottom: 100%; margin-bottom: 4px;"}
    background: var(--ic-card, #1e1e1e);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    display: none;
    flex-direction: column;
    padding: 4px;
  `;

  options.items.forEach(item => {
    if (item.divider) {
      const divider = document.createElement("div");
      divider.style.cssText = "height: 1px; background: var(--ic-border, #2b3136); margin: 4px 0;";
      menu.appendChild(divider);
      return;
    }

    const menuItem = document.createElement("button");
    menuItem.type = "button";
    menuItem.style.cssText = `
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: ${item.disabled ? "var(--ic-mutedText, #a7b0b7)" : "var(--ic-text, #e7ecef)"};
      text-align: left;
      cursor: ${item.disabled ? "not-allowed" : "pointer"};
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 4px;
      transition: background 0.2s;
      opacity: ${item.disabled ? "0.5" : "1"};
    `;

    if (item.icon) {
      menuItem.innerHTML = `<span>${item.icon}</span><span>${item.label}</span>`;
    } else {
      menuItem.textContent = item.label;
    }

    if (!item.disabled) {
      menuItem.onmouseenter = () => {
        menuItem.style.background = "rgba(255,255,255,0.05)";
      };
      menuItem.onmouseleave = () => {
        menuItem.style.background = "transparent";
      };
      menuItem.onclick = () => {
        item.onClick();
        menu.style.display = "none";
      };
    }

    menu.appendChild(menuItem);
  });

  button.onclick = (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "none" ? "flex" : "none";
  };

  // Fermer le menu en cliquant ailleurs
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target as Node)) {
      menu.style.display = "none";
    }
  });

  container.appendChild(button);
  container.appendChild(menu);

  return container;
}
