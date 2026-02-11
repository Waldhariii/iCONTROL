/**
 * ICONTROL_BUTTON_V1
 * Bouton réutilisable (primary, secondary, danger, ghost, small, loading)
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "default" | "small";

export interface ButtonOptions {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  icon?: string;
  type?: "button" | "submit";
}

export function createButton(opts: ButtonOptions): HTMLButtonElement {
  const {
    label,
    variant = "secondary",
    size = "default",
    loading = false,
    disabled = false,
    onClick,
    icon,
    type = "button"
  } = opts;

  const btn = document.createElement("button");
  btn.type = type;
  btn.disabled = disabled || loading;
  btn.setAttribute("aria-busy", String(loading));

  const baseClass = "ic-btn";
  const variantClass = `ic-btn--${variant}`;
  const sizeClass = `ic-btn--${size}`;
  btn.className = [baseClass, variantClass, sizeClass].join(" ");
  if (loading) btn.classList.add("is-loading");

  if (loading) {
    const spin = document.createElement("span");
    spin.setAttribute("aria-hidden", "true");
    spin.className = "ic-btn__spinner";
    btn.appendChild(spin);
    const txt = document.createElement("span");
    txt.textContent = "En cours…";
    txt.className = "ic-btn__label";
    btn.appendChild(txt);
  } else {
    if (icon) {
      const i = document.createElement("span");
      i.setAttribute("aria-hidden", "true");
      i.innerHTML = icon;
      i.className = "ic-btn__icon";
      btn.appendChild(i);
    }
    const txt = document.createElement("span");
    txt.textContent = label;
    txt.className = "ic-btn__label";
    btn.appendChild(txt);
  }

  if (onClick) btn.onclick = onClick;

  if (!document.getElementById("icontrol-button-style")) {
    const style = document.createElement("style");
    style.id = "icontrol-button-style";
    style.setAttribute("data-icontrol-allow", "1");
    style.textContent = "@keyframes icButtonSpin{to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
  }

  return btn;
}
