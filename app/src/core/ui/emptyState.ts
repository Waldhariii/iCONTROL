/**
 * ICONTROL_EMPTY_STATE_V1
 * État vide contextuel standardisé pour les listes/tables vides
 */

export interface EmptyStateOptions {
  filter?: string;
  searchQuery?: string;
  onAdd?: () => void;
  onClearFilter?: () => void;
}

export function createContextualEmptyState(
  context: "logs" | "users" | "subscriptions" | "data",
  options: EmptyStateOptions = {}
): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = `
    padding: 48px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  `;

  const icon = document.createElement("div");
  icon.style.cssText = `
    font-size: 48px;
    opacity: 0.5;
    margin-bottom: 8px;
  `;
  icon.textContent = "📭";
  container.appendChild(icon);

  const title = document.createElement("div");
  title.style.cssText = `
    font-size: 16px;
    font-weight: 600;
    color: var(--ic-text, #e7ecef);
    margin-bottom: 4px;
  `;

  const message = document.createElement("div");
  message.style.cssText = `
    font-size: 13px;
    color: var(--ic-mutedText, #a7b0b7);
    margin-bottom: 16px;
  `;

  // Messages contextuels
  if (options.filter || options.searchQuery) {
    title.textContent = "Aucun résultat trouvé";
    if (options.filter && options.searchQuery) {
      message.textContent = `Aucun résultat pour le filtre "${options.filter}" et la recherche "${options.searchQuery}"`;
    } else if (options.filter) {
      message.textContent = `Aucun résultat pour le filtre "${options.filter}"`;
    } else if (options.searchQuery) {
      message.textContent = `Aucun résultat pour la recherche "${options.searchQuery}"`;
    }
  } else {
    switch (context) {
      case "logs":
        title.textContent = "Aucun log disponible";
        message.textContent = "Aucun log n'a été enregistré pour le moment.";
        break;
      case "users":
        title.textContent = "Aucun utilisateur";
        message.textContent = "Aucun utilisateur n'a été configuré dans le système.";
        break;
      case "subscriptions":
        title.textContent = "Aucune souscription";
        message.textContent = "Aucune souscription n'a été configurée.";
        break;
      case "data":
        title.textContent = "Aucune donnée";
        message.textContent = "Aucune donnée disponible pour le moment.";
        break;
      default:
        title.textContent = "Aucun élément";
        message.textContent = "Aucun élément disponible.";
    }
  }

  container.appendChild(title);
  container.appendChild(message);

  // Actions
  const actions = document.createElement("div");
  actions.style.cssText = `
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  `;

  if (options.onClearFilter && (options.filter || options.searchQuery)) {
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Effacer les filtres";
    clearBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      background: transparent;
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    clearBtn.onmouseenter = () => {
      clearBtn.style.background = "var(--ic-bgHover, rgba(255,255,255,0.05))";
    };
    clearBtn.onmouseleave = () => {
      clearBtn.style.background = "transparent";
    };
    clearBtn.onclick = () => {
      if (options.onClearFilter) options.onClearFilter();
    };
    actions.appendChild(clearBtn);
  }

  if (options.onAdd) {
    const addBtn = document.createElement("button");
    addBtn.textContent = context === "users" ? "Ajouter un utilisateur" :
                         context === "subscriptions" ? "Ajouter une souscription" :
                         context === "logs" ? "Actualiser" :
                         "Ajouter";
    addBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: var(--ic-primary, #4a9eff);
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    `;
    addBtn.onmouseenter = () => {
      addBtn.style.background = "var(--ic-primaryHover, #3a8eef)";
    };
    addBtn.onmouseleave = () => {
      addBtn.style.background = "var(--ic-primary, #4a9eff)";
    };
    addBtn.onclick = () => {
      if (options.onAdd) options.onAdd();
    };
    actions.appendChild(addBtn);
  }

  if (actions.childElementCount > 0) {
    container.appendChild(actions);
  }

  return container;
}

export function createEmptyStateCard(options: {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = `
    padding: 24px;
    border: 1px dashed var(--ic-border, #2b3136);
    border-radius: 10px;
    background: var(--ic-card, #1a1d1f);
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  const title = document.createElement("div");
  title.textContent = options.title;
  title.style.cssText = "font-size: 14px; font-weight: 700; color: var(--ic-text, #e7ecef);";
  const message = document.createElement("div");
  message.textContent = options.message;
  message.style.cssText = "font-size: 12px; color: var(--ic-mutedText, #a7b0b7);";

  container.appendChild(title);
  container.appendChild(message);

  if (options.action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = options.action.label;
    btn.style.cssText = `
      align-self: flex-start;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      background: transparent;
      color: var(--ic-text, #e7ecef);
      font-size: 12px;
      cursor: pointer;
    `;
    btn.onclick = options.action.onClick;
    container.appendChild(btn);
  }

  return container;
}
