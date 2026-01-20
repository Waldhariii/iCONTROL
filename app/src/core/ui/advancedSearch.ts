/**
 * ICONTROL_ADVANCED_SEARCH_V1
 * Recherche avancée avec filtres multi-critères
 */

export interface SearchFilter {
  field: string;
  operator: "equals" | "contains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "between";
  value: any;
  value2?: any; // Pour "between"
}

export interface AdvancedSearchOptions {
  fields: Array<{ key: string; label: string; type: "text" | "number" | "date" | "select" }>;
  onSearch: (filters: SearchFilter[]) => any[] | Promise<any[]>;
  onSaveFilter?: (name: string, filters: SearchFilter[]) => void;
  savedFilters?: Array<{ name: string; filters: SearchFilter[] }>;
}

export function createAdvancedSearch(options: AdvancedSearchOptions): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = "display: flex; flex-direction: column; gap: 16px;";

  const filters: SearchFilter[] = [];

  // Barre de recherche principale
  const searchBar = document.createElement("div");
  searchBar.style.cssText = "display: flex; gap: 8px; align-items: center;";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Recherche rapide...";
  searchInput.style.cssText = `
    flex: 1;
    padding: 10px 12px;
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
    background: var(--ic-panel, #1a1d1f);
    color: var(--ic-text, #e7ecef);
    font-size: 13px;
  `;
  searchBar.appendChild(searchInput);

  const advancedBtn = document.createElement("button");
  advancedBtn.textContent = "🔍 Recherche avancée";
  advancedBtn.style.cssText = `
    padding: 10px 16px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
  `;
  searchBar.appendChild(advancedBtn);

  container.appendChild(searchBar);

  // Panneau recherche avancée (caché par défaut)
  const advancedPanel = document.createElement("div");
  advancedPanel.style.cssText = `
    display: none;
    padding: 16px;
    background: var(--ic-card, #1e1e1e);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
    flex-direction: column;
    gap: 12px;
  `;

  const filtersContainer = document.createElement("div");
  filtersContainer.id = "filters-container";
  filtersContainer.style.cssText = "display: flex; flex-direction: column; gap: 12px;";
  advancedPanel.appendChild(filtersContainer);

  const addFilterBtn = document.createElement("button");
  addFilterBtn.textContent = "+ Ajouter un filtre";
  addFilterBtn.style.cssText = `
    padding: 8px 12px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    align-self: flex-start;
  `;
  addFilterBtn.onclick = () => {
    addFilterRow();
  };
  advancedPanel.appendChild(addFilterBtn);

  const actionsDiv = document.createElement("div");
  actionsDiv.style.cssText = "display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;";

  const searchBtn = document.createElement("button");
  searchBtn.textContent = "Rechercher";
  searchBtn.style.cssText = `
    padding: 8px 16px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  `;
  searchBtn.onclick = async () => {
    const activeFilters = getActiveFilters();
    const results = await options.onSearch(activeFilters);
    // Émettre événement avec résultats
    container.dispatchEvent(new CustomEvent("search-results", { detail: results }));
  };
  actionsDiv.appendChild(searchBtn);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Effacer";
  clearBtn.style.cssText = `
    padding: 8px 16px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  `;
  clearBtn.onclick = () => {
    filtersContainer.innerHTML = "";
    filters.length = 0;
  };
  actionsDiv.appendChild(clearBtn);

  advancedPanel.appendChild(actionsDiv);
  container.appendChild(advancedPanel);

  // Toggle panneau avancé
  advancedBtn.onclick = () => {
    const isVisible = advancedPanel.style.display !== "none";
    advancedPanel.style.display = isVisible ? "none" : "flex";
    advancedBtn.textContent = isVisible ? "🔍 Recherche avancée" : "🔍 Masquer recherche avancée";
  };

  function addFilterRow() {
    const filterRow = document.createElement("div");
    filterRow.style.cssText = "display: flex; gap: 8px; align-items: center;";

    // Champ
    const fieldSelect = document.createElement("select");
    fieldSelect.style.cssText = `
      flex: 1;
      padding: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
    `;
    options.fields.forEach(field => {
      const opt = document.createElement("option");
      opt.value = field.key;
      opt.textContent = field.label;
      fieldSelect.appendChild(opt);
    });
    filterRow.appendChild(fieldSelect);

    // Opérateur
    const operatorSelect = document.createElement("select");
    operatorSelect.style.cssText = `
      width: 150px;
      padding: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
    `;
    ["equals", "contains", "startsWith", "endsWith", "greaterThan", "lessThan", "between"].forEach(op => {
      const opt = document.createElement("option");
      opt.value = op;
      opt.textContent = op === "equals" ? "=" : op === "contains" ? "contient" : op === "startsWith" ? "commence par" : op === "endsWith" ? "se termine par" : op === "greaterThan" ? ">" : op === "lessThan" ? "<" : "entre";
      operatorSelect.appendChild(opt);
    });
    filterRow.appendChild(operatorSelect);

    // Valeur
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.placeholder = "Valeur";
    valueInput.style.cssText = `
      flex: 1;
      padding: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
    `;
    filterRow.appendChild(valueInput);

    // Supprimer
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.style.cssText = `
      width: 32px;
      height: 32px;
      padding: 0;
      background: transparent;
      border: 1px solid var(--ic-border, #2b3136);
      color: var(--ic-text, #e7ecef);
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
    `;
    removeBtn.onclick = () => {
      filterRow.remove();
    };
    filterRow.appendChild(removeBtn);

    filtersContainer.appendChild(filterRow);
  }

  function getActiveFilters(): SearchFilter[] {
    const rows = filtersContainer.querySelectorAll("div[style*='display: flex']");
    const activeFilters: SearchFilter[] = [];

    rows.forEach(row => {
      const fieldSelect = row.querySelector("select") as HTMLSelectElement;
      const operatorSelect = row.querySelectorAll("select")[1] as HTMLSelectElement;
      const valueInput = row.querySelector("input") as HTMLInputElement;

      if (fieldSelect && operatorSelect && valueInput && valueInput.value.trim()) {
        activeFilters.push({
          field: fieldSelect.value,
          operator: operatorSelect.value as SearchFilter["operator"],
          value: valueInput.value.trim()
        });
      }
    });

    return activeFilters;
  }

  return container;
}
