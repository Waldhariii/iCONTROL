/**
 * ICONTROL_GLOBAL_SEARCH_V1
 * Recherche globale cross-pages avec raccourci clavier
 */

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: "user" | "page" | "module" | "document" | "log" | "setting";
  action: () => void;
  icon?: string;
}

export interface GlobalSearchOptions {
  onSearch: (query: string) => SearchResult[] | Promise<SearchResult[]>;
  placeholder?: string;
  shortcut?: string; // Default: "ctrl+k" or "cmd+k"
}

let searchInstance: {
  container: HTMLElement;
  input: HTMLInputElement;
  resultsContainer: HTMLElement;
  isOpen: boolean;
  close: () => void;
  open: () => void;
} | null = null;

export function createGlobalSearch(options: GlobalSearchOptions): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = `
    position: relative;
    display: inline-block;
    width: 300px;
  `;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = options.placeholder || "Rechercher... (Ctrl+K)";
  input.style.cssText = `
    width: 100%;
    padding: 8px 12px 8px 36px;
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
    background: var(--ic-panel, #1a1d1f);
    color: var(--ic-text, #e7ecef);
    font-size: 13px;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  `;

  // Icône de recherche
  const searchIcon = document.createElement("span");
  searchIcon.textContent = "🔍";
  searchIcon.style.cssText = `
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    pointer-events: none;
  `;
  container.appendChild(searchIcon);

  const resultsContainer = document.createElement("div");
  resultsContainer.style.cssText = `
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: var(--ic-card, #1e1e1e);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    max-height: 400px;
    overflow-y: auto;
    z-index: 10000;
    display: none;
    flex-direction: column;
  `;

  let currentResults: SearchResult[] = [];
  let selectedIndex = -1;

  const renderResults = (results: SearchResult[]) => {
    currentResults = results;
    selectedIndex = -1;
    resultsContainer.innerHTML = "";

    if (results.length === 0) {
      const noResults = document.createElement("div");
      noResults.style.cssText = "padding: 20px; text-align: center; color: var(--ic-mutedText, #a7b0b7); font-size: 13px;";
      noResults.textContent = "Aucun résultat";
      resultsContainer.appendChild(noResults);
    } else {
      results.forEach((result, index) => {
        const item = document.createElement("div");
        item.style.cssText = `
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--ic-border, #2b3136);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.15s;
        `;

        if (result.icon) {
          const icon = document.createElement("span");
          icon.textContent = result.icon;
          icon.style.cssText = "font-size: 16px; flex-shrink: 0;";
          item.appendChild(icon);
        }

        const content = document.createElement("div");
        content.style.cssText = "flex: 1; display: flex; flex-direction: column; gap: 2px;";

        const title = document.createElement("div");
        title.style.cssText = "color: var(--ic-text, #e7ecef); font-size: 13px; font-weight: 500;";
        title.textContent = result.title;
        content.appendChild(title);

        if (result.description) {
          const desc = document.createElement("div");
          desc.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 11px;";
          desc.textContent = result.description;
          content.appendChild(desc);
        }

        const type = document.createElement("div");
        type.style.cssText = `
          padding: 2px 6px;
          background: rgba(123,44,255,0.15);
          color: #9cdcfe;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        `;
        type.textContent = result.type;
        content.appendChild(type);

        item.appendChild(content);

        item.onmouseenter = () => {
          item.style.background = "rgba(255,255,255,0.05)";
          selectedIndex = index;
        };
        item.onmouseleave = () => {
          item.style.background = "transparent";
        };
        item.onclick = () => {
          result.action();
          closeSearch();
        };

        resultsContainer.appendChild(item);
      });
    }

    resultsContainer.style.display = "flex";
  };

  let searchTimeout: number | null = null;
  input.oninput = async () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const query = input.value.trim();

    if (query.length < 2) {
      resultsContainer.style.display = "none";
      return;
    }

    searchTimeout = window.setTimeout(async () => {
      const results = await options.onSearch(query);
      renderResults(results);
    }, 200);
  };

  input.onkeydown = (e) => {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
      updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection();
    } else if (e.key === "Enter" && selectedIndex >= 0 && currentResults[selectedIndex]) {
      e.preventDefault();
      currentResults[selectedIndex].action();
      closeSearch();
    }
  };

  const updateSelection = () => {
    const items = resultsContainer.querySelectorAll("div[style*='cursor: pointer']");
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        (item as HTMLElement).style.background = "rgba(255,255,255,0.1)";
      } else {
        (item as HTMLElement).style.background = "transparent";
      }
    });
  };

  const closeSearch = () => {
    input.value = "";
    resultsContainer.style.display = "none";
    currentResults = [];
    selectedIndex = -1;
    searchInstance!.isOpen = false;
    input.blur();
  };

  const openSearch = () => {
    input.focus();
    if (input.value.trim().length >= 2) {
      input.oninput?.({} as any);
    }
    searchInstance!.isOpen = true;
  };

  input.onfocus = () => {
    if (input.value.trim().length >= 2) {
      resultsContainer.style.display = "flex";
    }
  };

  // Raccourci clavier global
  const shortcut = options.shortcut || "ctrl+k";
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const isCtrlK = (isMac ? e.metaKey : e.ctrlKey) && e.key === "k";
    
    if (isCtrlK && !searchInstance!.isOpen) {
      e.preventDefault();
      openSearch();
    }
  });

  // Fermer en cliquant ailleurs
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target as Node)) {
      closeSearch();
    }
  });

  container.appendChild(input);
  container.appendChild(resultsContainer);

  searchInstance = {
    container,
    input,
    resultsContainer,
    isOpen: false,
    close: closeSearch,
    open: openSearch
  };

  return container;
}
