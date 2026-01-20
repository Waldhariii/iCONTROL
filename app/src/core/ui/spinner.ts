/**
 * ICONTROL_SPINNER_V1
 * Indicateur de chargement réutilisable
 */

export interface SpinnerOptions {
  size?: "small" | "medium" | "large";
  color?: "primary" | "white" | "muted";
  inline?: boolean;
  label?: string;
}

export function createSpinner(options: SpinnerOptions = {}): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  
  if (options.inline) {
    container.style.cssText = "display: inline-flex; align-items: center; gap: 8px;";
  } else {
    container.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px;";
  }

  const size = options.size || "medium";
  const sizes = {
    small: "16px",
    medium: "24px",
    large: "32px"
  };

  const colors = {
    primary: "#3b82f6",
    white: "#ffffff",
    muted: "var(--ic-mutedText, #a7b0b7)"
  };

  const spinner = document.createElement("div");
  spinner.style.cssText = `
    width: ${sizes[size]};
    height: ${sizes[size]};
    border: 3px solid ${options.color === "primary" ? "rgba(59, 130, 246, 0.2)" : options.color === "white" ? "rgba(255, 255, 255, 0.2)" : "rgba(167, 176, 183, 0.2)"};
    border-top-color: ${colors[options.color || "primary"]};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  `;

  if (!document.getElementById("spinner-styles")) {
    const style = document.createElement("style");
    style.id = "spinner-styles";
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(spinner);

  if (options.label) {
    const label = document.createElement("div");
    label.style.cssText = `color: ${colors[options.color || "primary"]}; font-size: 13px; font-weight: 500;`;
    label.textContent = options.label;
    container.appendChild(label);
  }

  return container;
}
