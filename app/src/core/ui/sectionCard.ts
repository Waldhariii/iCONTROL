/**
 * ICONTROL_SECTION_CARD_V1
 * Cartes de section standardisées (titre, description, actions, body)
 */
export interface SectionCardOptions {
  title: string;
  description?: string;
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
  card.style.cssText = `
    background: var(--ic-card, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    padding: ${options.dense ? "10px 14px" : "12px 16px"};
    background: var(--ic-panel, #1a1d1f);
    border-bottom: 1px solid var(--ic-border, #2b3136);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  `;

  const titleBlock = document.createElement("div");
  titleBlock.style.cssText = "display:flex; flex-direction:column; gap:2px;";
  const title = document.createElement("div");
  title.textContent = options.title;
  title.style.cssText = "font-size: 13px; font-weight: 700; color: var(--ic-text, #e7ecef);";
  titleBlock.appendChild(title);
  if (options.description) {
    const desc = document.createElement("div");
    desc.textContent = options.description;
    desc.style.cssText = "font-size: 12px; color: var(--ic-mutedText, #a7b0b7);";
    titleBlock.appendChild(desc);
  }
  header.appendChild(titleBlock);

  if (options.actions && options.actions.length > 0) {
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:8px; align-items:center; flex-wrap:wrap;";
    options.actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action.icon ? `${action.icon} ${action.label}` : action.label;
      btn.style.cssText = `
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid ${action.primary ? "var(--ic-accent, #7b2cff)" : "var(--ic-border, #2b3136)"};
        background: ${action.primary ? "var(--ic-accent, #7b2cff)" : "transparent"};
        color: ${action.primary ? "white" : "var(--ic-text, #e7ecef)"};
        font-weight: 600;
        font-size: 11px;
        cursor: pointer;
      `;
      btn.onclick = action.onClick;
      actions.appendChild(btn);
    });
    header.appendChild(actions);
  } else if (options.headerRight) {
    header.appendChild(options.headerRight);
  }

  const body = document.createElement("div");
  body.style.cssText = `
    padding: ${options.dense ? "12px 14px" : "16px"};
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  if (options.collapsible) {
    let collapsed = false;
    header.style.cursor = "pointer";
    header.onclick = () => {
      collapsed = !collapsed;
      body.style.display = collapsed ? "none" : "flex";
    };
  }

  card.appendChild(header);
  card.appendChild(body);

  return { card, body, header };
}
