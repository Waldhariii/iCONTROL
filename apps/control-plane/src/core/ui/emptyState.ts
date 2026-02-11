/**
 * ICONTROL_EMPTY_STATE_V1
 * État vide contextuel standardisé pour les listes/tables vides
 */
import { createButton } from "./button";

export interface EmptyStateOptions {
  filter?: string;
  searchQuery?: string;
    message?: string;
onAdd?: () => void;
  onClearFilter?: () => void;
}

export function createContextualEmptyState(
  context: "logs" | "users" | "subscriptions" | "data",
  options: EmptyStateOptions = {}
): HTMLElement {
  const container = document.createElement("div");
  container.className = "ic-empty-state";

  const title = document.createElement("div");
  title.className = "ic-empty-state__title";

  const message = document.createElement("div");
  message.className = "ic-empty-state__message";

  // Copy stable inputs
  const filter = options.filter ?? "";
  const searchQuery = options.searchQuery ?? "";

  // Deterministic copy (no i18n churn here; keep French defaults)
  const titles: Record<string, string> = {
    logs: "Aucun log",
    users: "Aucun utilisateur",
    subscriptions: "Aucun abonnement",
    data: "Aucune donnée",
  };

  title.textContent = titles[context] ?? "Aucun élément";
  message.textContent =
    options.message ??
    (filter || searchQuery
      ? "Aucun résultat pour les filtres actuels."
      : "Aucun élément à afficher pour le moment.");

  container.appendChild(title);
  container.appendChild(message);

  // Actions (optional)
  const actions = document.createElement("div");
  actions.className = "ic-empty-state__actions";

  if (options.onClearFilter && (filter || searchQuery)) {
    const clearBtn = createButton({
      label: "Effacer les filtres",
      variant: "secondary",
      size: "default",
      onClick: () => options.onClearFilter?.(),
    });
    actions.appendChild(clearBtn);
  }

  if (options.onAdd) {
    const addBtn = createButton({
      label: "Ajouter",
      variant: "primary",
      size: "default",
      onClick: () => options.onAdd?.(),
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
    const action = options.action;
    const btn = createButton({
      label: action.label,
      variant: "secondary",
      size: "small",
      onClick: () => action.onClick(),
    });
    container.appendChild(btn);
  }

  return container;
}


