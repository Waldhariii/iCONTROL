/**
 * ICONTROL_COMMAND_PALETTE_V1
 * Command palette globale (⌘K / Ctrl+K)
 */

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category?: string;
  action: () => void;
  keywords?: string[];
}

class CommandPalette {
  private commands: Command[] = [];
  private isOpen = false;
  private modal: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private resultsContainer: HTMLElement | null = null;

  register(command: Command): void {
    this.commands.push(command);
  }

  unregister(id: string): void {
    this.commands = this.commands.filter(cmd => cmd.id !== id);
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  private render(): void {
    // Créer modal
    this.modal = document.createElement("div");
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
    `;

    // Container central
    const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
    container.style.cssText = `
      width: 600px;
      max-width: 90vw;
      background: var(--ic-panel, #1a1d1f);
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 70vh;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid var(--ic-border, #2b3136);
    `;
    const title = document.createElement("div");
    title.textContent = "Command Palette";
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: var(--ic-text, #e7ecef);
      margin-bottom: 8px;
    `;

    // Search input
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Tapez pour rechercher... (⌘K / Ctrl+K)";
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      background: var(--ic-bg, #0f1112);
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      color: var(--ic-text, #e7ecef);
      font-size: 14px;
      outline: none;
    `;
    this.searchInput.addEventListener("input", () => this.filterCommands());
    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const firstResult = this.resultsContainer?.querySelector(".command-item") as HTMLElement;
        if (firstResult) firstResult.click();
      } else if (e.key === "Escape") {
        this.close();
      }
    });

    header.appendChild(title);
    header.appendChild(this.searchInput);

    // Results container
    this.resultsContainer = document.createElement("div");
    this.resultsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    container.appendChild(header);
    container.appendChild(this.resultsContainer);

    // Close on backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    this.modal.appendChild(container);
    document.body.appendChild(this.modal);

    // Focus input
    setTimeout(() => this.searchInput?.focus(), 100);

    // Filter initial
    this.filterCommands();

    // Keyboard handler
    document.addEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      this.close();
    }
  };

  private filterCommands(): void {
    if (!this.resultsContainer || !this.searchInput) return;

    const query = this.searchInput.value.toLowerCase().trim();
    let filtered = this.commands;

    if (query) {
      filtered = this.commands.filter(cmd => {
        const searchText = `${cmd.label} ${cmd.description || ""} ${cmd.keywords?.join(" ") || ""} ${cmd.category || ""}`.toLowerCase();
        return searchText.includes(query);
      });
    }

    // Grouper par catégorie
    const grouped = new Map<string, Command[]>();
    filtered.forEach(cmd => {
      const cat = cmd.category || "Autres";
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(cmd);
    });

    // Render
    this.resultsContainer.innerHTML = "";

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "Aucun résultat";
      empty.style.cssText = `
        padding: 20px;
        text-align: center;
        color: var(--ic-mutedText, #a7b0b7);
        font-size: 14px;
      `;
      this.resultsContainer.appendChild(empty);
      return;
    }

    grouped.forEach((cmds, category) => {
      // Category header
      const catHeader = document.createElement("div");
      catHeader.textContent = category;
      catHeader.style.cssText = `
        padding: 8px 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--ic-mutedText, #a7b0b7);
        letter-spacing: 0.5px;
      `;
      this.resultsContainer!.appendChild(catHeader);

      // Commands
      cmds.forEach(cmd => {
        const item = document.createElement("div");
        item.className = "command-item";
        item.style.cssText = `
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.15s;
        `;
        item.addEventListener("mouseenter", () => {
          item.style.background = "rgba(255, 255, 255, 0.05)";
        });
        item.addEventListener("mouseleave", () => {
          item.style.background = "transparent";
        });
        item.addEventListener("click", () => {
          cmd.action();
          this.close();
        });

        // Icon
        if (cmd.icon) {
          const icon = document.createElement("span");
          icon.textContent = cmd.icon;
          icon.style.cssText = "font-size: 18px;";
          item.appendChild(icon);
        }

        // Content
        const content = document.createElement("div");
        content.style.cssText = "flex: 1; display: flex; flex-direction: column; gap: 2px;";
        const label = document.createElement("div");
        label.textContent = cmd.label;
        label.style.cssText = "font-size: 14px; color: var(--ic-text, #e7ecef); font-weight: 500;";
        content.appendChild(label);
        if (cmd.description) {
          const desc = document.createElement("div");
          desc.textContent = cmd.description;
          desc.style.cssText = "font-size: 12px; color: var(--ic-mutedText, #a7b0b7);";
          content.appendChild(desc);
        }
        item.appendChild(content);

        this.resultsContainer!.appendChild(item);
      });
    });
  }
}

import { navigate } from "/src/runtime/navigate";

export interface CpNavItem {
  id: string;
  label: string;
  description: string;
  icon?: string;
  category: string;
  keywords: string[];
  hash: string;
}

export const CP_NAV_ITEMS: CpNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Aller au tableau de bord",
    icon: "📊",
    category: "Navigation",
    keywords: ["tableau", "bord", "accueil"],
    hash: "#/dashboard"
  },
  {
    id: "users",
    label: "Utilisateurs",
    description: "Gérer les utilisateurs",
    icon: "👥",
    category: "Navigation",
    keywords: ["user", "personne", "admin"],
    hash: "#/users"
  },
  {
    id: "organizations",
    label: "Organisations",
    description: "Gérer les organisations",
    icon: "🏢",
    category: "Navigation",
    keywords: ["org", "organisation", "company"],
    hash: "#/organization"
  },
  {
    id: "developer",
    label: "Developer",
    description: "Outils developpeur",
    icon: "🛠️",
    category: "Navigation",
    keywords: ["dev", "developer", "tools"],
    hash: "#/developer"
  },
  {
    id: "developer_entitlements",
    label: "Developer Entitlements",
    description: "Accès et entitlements",
    icon: "🧩",
    category: "Navigation",
    keywords: ["developer", "entitlements", "access", "permissions"],
    hash: "#/developer/entitlements"
  },
  {
    id: "system",
    label: "Système",
    description: "Configuration système",
    icon: "⚙️",
    category: "Navigation",
    keywords: ["config", "parametres", "settings"],
    hash: "#/system"
  },
  {
    id: "subscriptions",
    label: "Abonnements",
    description: "Gérer les abonnements",
    icon: "💳",
    category: "Navigation",
    keywords: ["sub", "abonnement", "premium"],
    hash: "#/subscription"
  },
  {
    id: "api",
    label: "API",
    description: "Tester les APIs",
    icon: "🔌",
    category: "Navigation",
    keywords: ["api", "endpoint", "test"],
    hash: "#/api"
  },
  {
    id: "network",
    label: "Network",
    description: "Surveiller l'activité réseau",
    icon: "🌐",
    category: "Navigation",
    keywords: ["network", "reseau", "traffic"],
    hash: "#/network"
  },
  {
    id: "logs",
    label: "Logs",
    description: "Voir les logs système",
    icon: "📋",
    category: "Navigation",
    keywords: ["log", "journal", "audit"],
    hash: "#/logs"
  },
  {
    id: "settings",
    label: "Paramètres",
    description: "Ouvrir les paramètres",
    icon: "⚙️",
    category: "Navigation",
    keywords: ["settings", "parametres", "config"],
    hash: "#/settings"
  },
  {
    id: "verification",
    label: "Verification",
    description: "Vérifier l'état et la conformité",
    icon: "✅",
    category: "Navigation",
    keywords: ["verification", "verify", "compliance", "check"],
    hash: "#/verification"
  }
];

// Instance globale
const commandPalette = new CommandPalette();

// Initialiser raccourcis clavier
export function initializeCommandPalette(): void {
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    
    if (modifier && e.key === "k") {
      e.preventDefault();
      commandPalette.open();
    }
  });

  // Commandes par défaut
  const defaultCommands: Command[] = CP_NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    icon: item.icon,
    category: item.category,
    keywords: item.keywords,
    action: () => {
      navigate(item.hash);
    }
  }));

  // Enregistrer toutes les commandes par défaut
  defaultCommands.forEach(cmd => commandPalette.register(cmd));
}

export function registerCommand(command: Command): void {
  commandPalette.register(command);
}

export function unregisterCommand(id: string): void {
  commandPalette.unregister(id);
}
