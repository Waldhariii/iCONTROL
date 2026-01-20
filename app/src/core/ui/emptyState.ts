/**
 * ICONTROL_EMPTY_STATE_V1
 * Système d'états vides intelligents réutilisable
 */

export interface EmptyStateOptions {
  icon?: string;
  title: string;
  message?: string;
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    primary?: boolean;
  }>;
  illustration?: string;
}

export function createEmptyState(options: EmptyStateOptions): HTMLElement {
  const {
    icon = "📋",
    title,
    message,
    actions = [],
    illustration
  } = options;

  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = `
    padding: 60px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--ic-mutedText, #a7b0b7);
  `;

  // Illustration ou icône
  if (illustration) {
    const img = document.createElement("img");
    img.src = illustration;
    img.alt = title;
    img.style.cssText = `
      width: 200px;
      height: 200px;
      object-fit: contain;
      margin-bottom: 24px;
      opacity: 0.6;
    `;
    container.appendChild(img);
  } else {
    const iconEl = document.createElement("div");
    iconEl.textContent = icon;
    iconEl.style.cssText = `
      font-size: 64px;
      margin-bottom: 16px;
      line-height: 1;
    `;
    container.appendChild(iconEl);
  }

  // Titre
  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.cssText = `
    font-size: 18px;
    font-weight: 600;
    color: var(--ic-text, #e7ecef);
    margin-bottom: ${message ? "8px" : actions.length > 0 ? "24px" : "0"};
  `;
  container.appendChild(titleEl);

  // Message
  if (message) {
    const messageEl = document.createElement("div");
    messageEl.textContent = message;
    messageEl.style.cssText = `
      font-size: 14px;
      color: var(--ic-mutedText, #a7b0b7);
      margin-bottom: ${actions.length > 0 ? "24px" : "0"};
      max-width: 500px;
      line-height: 1.6;
    `;
    container.appendChild(messageEl);
  }

  // Actions
  if (actions.length > 0) {
    const actionsContainer = document.createElement("div");
    actionsContainer.style.cssText = `
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
    `;

    actions.forEach(action => {
      const btn = document.createElement("button");
      btn.textContent = action.icon ? `${action.icon} ${action.label}` : action.label;
      btn.style.cssText = `
        padding: 10px 20px;
        border-radius: 8px;
        border: 1px solid ${action.primary ? "var(--ic-accent, #7b2cff)" : "var(--ic-border, #2b3136)"};
        background: ${action.primary ? "var(--ic-accent, #7b2cff)" : "transparent"};
        color: ${action.primary ? "white" : "var(--ic-text, #e7ecef)"};
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      `;
      btn.addEventListener("mouseenter", () => {
        if (action.primary) {
          btn.style.opacity = "0.9";
        } else {
          btn.style.background = "rgba(255, 255, 255, 0.05)";
          btn.style.borderColor = "var(--ic-accent, #7b2cff)";
        }
      });
      btn.addEventListener("mouseleave", () => {
        if (action.primary) {
          btn.style.opacity = "1";
        } else {
          btn.style.background = "transparent";
          btn.style.borderColor = "var(--ic-border, #2b3136)";
        }
      });
      btn.addEventListener("click", action.onClick);
      actionsContainer.appendChild(btn);
    });

    container.appendChild(actionsContainer);
  }

  return container;
}

/**
 * Helper pour créer un état vide contextuel basé sur le type de données
 */
export function createContextualEmptyState(
  type: "users" | "organizations" | "subscriptions" | "logs" | "data" | "search",
  context?: {
    filter?: string;
    searchQuery?: string;
    onAdd?: () => void;
    onClearFilter?: () => void;
  }
): HTMLElement {
  const configs: Record<string, EmptyStateOptions> = {
    users: {
      icon: "👥",
      title: context?.filter ? `Aucun utilisateur avec le rôle "${context.filter}"` : "Aucun utilisateur trouvé",
      message: context?.searchQuery 
        ? `Aucun résultat pour "${context.searchQuery}". Essayez un autre terme de recherche.`
        : "Commencez par ajouter un utilisateur au système.",
      actions: [
        ...(context?.onClearFilter ? [{
          label: "Effacer le filtre",
          onClick: context.onClearFilter,
          primary: false
        }] : []),
        ...(context?.onAdd ? [{
          label: "Ajouter un utilisateur",
          icon: "➕",
          onClick: context.onAdd,
          primary: true
        }] : [])
      ]
    },
    organizations: {
      icon: "🏢",
      title: "Aucune organisation trouvée",
      message: "Créez votre première organisation pour commencer.",
      actions: context?.onAdd ? [{
        label: "Créer une organisation",
        icon: "➕",
        onClick: context.onAdd,
        primary: true
      }] : []
    },
    subscriptions: {
      icon: "💳",
      title: "Aucun abonnement actif",
      message: "Ajoutez un abonnement pour activer des fonctionnalités premium.",
      actions: context?.onAdd ? [{
        label: "Ajouter un abonnement",
        icon: "➕",
        onClick: context.onAdd,
        primary: true
      }] : []
    },
    logs: {
      icon: "📋",
      title: "Aucun log disponible",
      message: "Les logs apparaîtront ici lorsqu'il y aura de l'activité.",
      actions: []
    },
    data: {
      icon: "📊",
      title: "Aucune donnée disponible",
      message: context?.searchQuery 
        ? `Aucun résultat pour "${context.searchQuery}".`
        : "Aucune donnée à afficher pour le moment.",
      actions: [
        ...(context?.onClearFilter ? [{
          label: "Effacer le filtre",
          onClick: context.onClearFilter,
          primary: false
        }] : [])
      ]
    },
    search: {
      icon: "🔍",
      title: "Aucun résultat",
      message: context?.searchQuery 
        ? `Aucun résultat trouvé pour "${context.searchQuery}". Essayez un autre terme.`
        : "Entrez un terme de recherche pour commencer.",
      actions: context?.onClearFilter ? [{
        label: "Effacer la recherche",
        onClick: context.onClearFilter,
        primary: false
      }] : []
    }
  };

  return createEmptyState(configs[type] || configs.data);
}
