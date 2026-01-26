/**
 * ICONTROL_EMPTY_STATE_V1
 * État vide contextuel standardisé pour les listes/tables vides
 */
import { createButton } from "./button";

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
  container.className = "ic-empty-state";

  const icon = document.createElement("div");
  icon.setAttribute("aria-hidden", "true");
  icon.className = "ic-empty-state__icon";
  icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><rect x="3" y="4" width="18" height="14" rx="2"/></svg>`;
  container.appendChild(icon);

  const title = document.createElement("div");
  title.className = "ic-empty-state__title";

  const message = document.createElement("div");
  message.className = "ic-empty-state__message";

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
  actions.className = "ic-empty-state__actions";

  if (options.onClearFilter && (options.filter || options.searchQuery)) {
    const clearBtn = createButton({
      label: "Effacer les filtres",
      variant: "secondary",
      size: "default",
      onClick: () => {
        if (options.onClearFilter) options.onClearFilter();
      }
    });
    actions.appendChild(clearBtn);
  }

  if (options.onAdd) {
    const label = context === "users" ? "Ajouter un utilisateur" :
                  context === "subscriptions" ? "Ajouter une souscription" :
                  context === "logs" ? "Actualiser" :
                  "Ajouter";
    const addBtn = createButton({
      label,
      variant: "primary",
      size: "default",
      onClick: () => {
        if (options.onAdd) options.onAdd();
      }
    });
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
  container.className = "ic-empty-card";

  const title = document.createElement("div");
  title.textContent = options.title;
  title.className = "ic-empty-card__title";
  const message = document.createElement("div");
  message.textContent = options.message;
  message.className = "ic-empty-card__message";

  container.appendChild(title);
  container.appendChild(message);

  if (options.action) {
    const btn = createButton({
      label: options.action.label,
      variant: "secondary",
      size: "small",
      onClick: () => options.action.onClick()
    });
    container.appendChild(btn);
  }

  return container;
}
