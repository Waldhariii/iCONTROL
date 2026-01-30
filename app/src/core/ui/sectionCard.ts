/**
 * ICONTROL_SECTION_CARD_V1
 * Cartes de section standardisées (titre, description, actions, body)
 */
import { createButton } from "./button";

export interface SectionCardOptions {
  title: string;
  description?: string;
  /** Icône (SVG inline ou emoji) à gauche du titre — style Enterprise */
  icon?: string;
  actions?: Array<{ label: string; onClick: () => void; primary?: boolean; icon?: string }>;
  dense?: boolean;
  collapsible?: boolean;
  headerRight?: HTMLElement;
}

export function createSectionCard(options: SectionCardOptions): {
  card: HTMLElement;
  body: HTMLElement;
  header: HTMLElement;
} {
  const card = document.createElement("div");
  card.className = "ic-section-card";
  if (options.dense) card.classList.add("is-dense");

  const header = document.createElement("div");
  header.className = "ic-section-card__header";

  let collapsed = false;
  let chevronEl: HTMLElement | null = null;
  if (options.collapsible) {
    header.setAttribute("aria-expanded", "true");
    chevronEl = document.createElement("span");
    chevronEl.setAttribute("aria-hidden", "true");
    chevronEl.textContent = "▼";
    chevronEl.className = "ic-section-card__chevron";
    header.appendChild(chevronEl);
  }

  const titleBlock = document.createElement("div");
  titleBlock.className = "ic-section-card__title-block";
  const titleRow = document.createElement("div");
  titleRow.className = "ic-section-card__title-row";
  if (options.icon) {
    const iconEl = document.createElement("span");
    iconEl.setAttribute("aria-hidden", "true");
    iconEl.innerHTML = options.icon;
    iconEl.className = "ic-section-card__icon";
    titleRow.appendChild(iconEl);
  }
  const title = document.createElement("div");
  title.textContent = options.title;
  title.className = "ic-section-card__title";
  titleRow.appendChild(title);
  titleBlock.appendChild(titleRow);
  if (options.description) {
    const desc = document.createElement("div");
    desc.textContent = options.description;
    desc.className = "ic-section-card__desc";
    titleBlock.appendChild(desc);
  }
  header.appendChild(titleBlock);

  if (options.actions && options.actions.length > 0) {
    const actions = document.createElement("div");
    actions.className = "ic-section-card__actions";
    options.actions.forEach((action) => {
      const btn = createButton({
        label: action.label,
        variant: action.primary ? "primary" : "secondary",
        size: "small",
        icon: action.icon,
        onClick: (e) => { e.stopPropagation(); action.onClick(); }
      });
      actions.appendChild(btn);
    });
    header.appendChild(actions);
  } else if (options.headerRight) {
    header.appendChild(options.headerRight);
  }

  const body = document.createElement("div");
  body.className = "ic-section-card__body";

  if (options.collapsible) {
    header.style.cursor = "pointer";
    header.onclick = (e) => {
      if ((e.target as Element)?.closest?.("button, a")) return;
      collapsed = !collapsed;
      body.style.display = collapsed ? "none" : "flex";
      header.setAttribute("aria-expanded", String(!collapsed));
      if (chevronEl) chevronEl.textContent = collapsed ? "▶" : "▼";
    };
  }

  card.appendChild(header);
  card.appendChild(body);

  return { card, body, header };
}
