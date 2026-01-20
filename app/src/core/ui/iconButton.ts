/**
 * ICONTROL_ICON_BUTTON_V1
 * Bouton avec icône uniquement
 */

export interface IconButtonOptions {
  icon: string;
  label?: string;
  onClick: () => void;
  size?: "small" | "medium" | "large";
  color?: "primary" | "danger" | "warning" | "success" | "muted";
  variant?: "filled" | "outlined" | "ghost";
  disabled?: boolean;
}

export function createIconButton(options: IconButtonOptions): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.disabled = options.disabled || false;

  const sizes = {
    small: { size: "24px", padding: "6px", fontSize: "14px" },
    medium: { size: "32px", padding: "8px", fontSize: "16px" },
    large: { size: "40px", padding: "10px", fontSize: "20px" }
  };

  const size = sizes[options.size || "medium"];

  const colors = {
    primary: { bg: "#3b82f6", hover: "#2563eb", text: "#ffffff", ghost: "rgba(59,130,246,0.15)" },
    danger: { bg: "#f48771", hover: "#ef4444", text: "#ffffff", ghost: "rgba(244,135,113,0.15)" },
    warning: { bg: "#fbbf24", hover: "#f59e0b", text: "#ffffff", ghost: "rgba(220,220,170,0.15)" },
    success: { bg: "#34d399", hover: "#10b981", text: "#ffffff", ghost: "rgba(78,201,176,0.15)" },
    muted: { bg: "transparent", hover: "rgba(255,255,255,0.05)", text: "var(--ic-mutedText, #a7b0b7)", ghost: "transparent" }
  };

  const color = colors[options.color || "primary"];
  const variant = options.variant || "outlined";

  let bgColor = "transparent";
  let borderColor = "var(--ic-border, #2b3136)";
  let textColor = color.text;

  if (variant === "filled") {
    bgColor = color.bg;
    borderColor = color.bg;
    textColor = "#ffffff";
  } else if (variant === "ghost") {
    bgColor = color.ghost;
    borderColor = "transparent";
    textColor = options.color === "muted" ? color.text : color.bg;
  } else {
    bgColor = "transparent";
    borderColor = color.bg;
    textColor = color.bg;
  }

  button.innerHTML = options.label ? `<span style="margin-right: 6px;">${options.icon}</span>${options.label}` : options.icon;
  button.title = options.label || "";

  button.style.cssText = `
    width: ${options.label ? "auto" : size.size};
    height: ${size.size};
    padding: ${options.label ? "6px 12px" : size.padding};
    background: ${bgColor};
    border: 1px solid ${borderColor};
    border-radius: 6px;
    color: ${textColor};
    font-size: ${size.fontSize};
    cursor: ${options.disabled ? "not-allowed" : "pointer"};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    opacity: ${options.disabled ? "0.5" : "1"};
  `;

  if (!options.disabled) {
    const hoverBg = variant === "filled" ? color.hover : variant === "ghost" ? color.ghost : "rgba(255,255,255,0.05)";
    button.onmouseenter = () => {
      button.style.background = hoverBg;
      button.style.transform = "scale(1.05)";
    };
    button.onmouseleave = () => {
      button.style.background = bgColor;
      button.style.transform = "scale(1)";
    };
    button.onclick = options.onClick;
  }

  return button;
}
