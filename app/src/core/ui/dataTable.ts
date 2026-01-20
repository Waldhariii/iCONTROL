/**
 * ICONTROL_DATA_TABLE_V1
 * Tableau de données réutilisable avec tri, filtres, pagination et recherche
 */

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => string | HTMLElement;
  width?: string;
}

export interface TableOptions<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  actions?: (row: T) => Array<{ label: string; onClick: (row: T) => void; style?: "primary" | "danger" | "warning" }>;
  onRowClick?: (row: T) => void;
}

export function createDataTable<T = any>(options: TableOptions<T>): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 16px; min-width: 0;";

  let filteredData = [...options.data];
  let sortedColumn: { key: string; direction: "asc" | "desc" } | null = null;
  let currentPage = 1;
  const pageSize = options.pageSize || 10;

  // Barre de recherche
  if (options.searchable !== false) {
    const searchBar = document.createElement("div");
    searchBar.style.cssText = "display: flex; gap: 8px; align-items: center; min-width: 0;";
    
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Rechercher...";
    searchInput.style.cssText = `
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
    `;

    searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      filteredData = options.data.filter(row => {
        return options.columns.some(col => {
          const value = row[col.key as keyof T];
          return value && String(value).toLowerCase().includes(query);
        });
      });
      currentPage = 1;
      renderTable();
      renderPagination();
    });

    searchBar.appendChild(searchInput);
    container.appendChild(searchBar);
  }

  // Table
  const tableWrapper = document.createElement("div");
  tableWrapper.style.cssText = "overflow-x: auto; border: 1px solid var(--ic-border, #2b3136); border-radius: 8px; min-width: 0;";

  const table = document.createElement("table");
  table.style.cssText = "width: 100%; border-collapse: collapse; font-size: 13px;";

  const thead = document.createElement("thead");
  thead.style.cssText = "background: var(--ic-panel, #1a1d1f); border-bottom: 1px solid var(--ic-border, #2b3136);";

  const tbody = document.createElement("tbody");

  const renderTable = () => {
    tbody.innerHTML = "";

    // Pagination
    const startIndex = options.pagination !== false ? (currentPage - 1) * pageSize : 0;
    const endIndex = options.pagination !== false ? startIndex + pageSize : filteredData.length;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    paginatedData.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      tr.style.cssText = `
        border-bottom: 1px solid var(--ic-border, #2b3136);
        ${options.onRowClick ? "cursor: pointer;" : ""}
        transition: background 0.2s;
      `;

      if (options.onRowClick) {
        tr.onmouseenter = () => {
          tr.style.background = "rgba(255,255,255,0.05)";
        };
        tr.onmouseleave = () => {
          tr.style.background = "transparent";
        };
        tr.onclick = () => {
          if (options.onRowClick) options.onRowClick(row);
        };
      }

      options.columns.forEach((col) => {
        const td = document.createElement("td");
        td.style.cssText = "padding: 12px 16px; color: var(--ic-text, #e7ecef);";
        if (col.width) td.style.width = col.width;

        const value = row[col.key as keyof T];
        if (col.render) {
          const rendered = col.render(value, row);
          if (rendered instanceof HTMLElement) {
            td.appendChild(rendered);
          } else {
            td.innerHTML = rendered;
          }
        } else {
          td.textContent = value ? String(value) : "";
        }

        tr.appendChild(td);
      });

      // Actions column
      if (options.actions) {
        const actions = options.actions(row);
        if (actions.length > 0) {
          const td = document.createElement("td");
          td.style.cssText = "padding: 12px 16px;";

          const actionsContainer = document.createElement("div");
          actionsContainer.style.cssText = "display: flex; gap: 8px; align-items: center;";

          actions.forEach((action) => {
            const btn = document.createElement("button");
            btn.textContent = action.label;
            btn.style.cssText = `
              padding: 6px 12px;
              border: 1px solid var(--ic-border, #2b3136);
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 500;
              transition: all 0.2s;
              background: ${action.style === "danger" ? "rgba(244,135,113,0.15)" : action.style === "warning" ? "rgba(220,220,170,0.15)" : "var(--ic-panel, #1a1d1f)"};
              color: ${action.style === "danger" ? "#f48771" : action.style === "warning" ? "#dcdcaa" : "var(--ic-text, #e7ecef)"};
            `;

            btn.onmouseenter = () => {
              btn.style.background = action.style === "danger" ? "rgba(244,135,113,0.25)" : action.style === "warning" ? "rgba(220,220,170,0.25)" : "rgba(255,255,255,0.1)";
            };
            btn.onmouseleave = () => {
              btn.style.background = action.style === "danger" ? "rgba(244,135,113,0.15)" : action.style === "warning" ? "rgba(220,220,170,0.15)" : "var(--ic-panel, #1a1d1f)";
            };

            btn.onclick = (e) => {
              e.stopPropagation();
              action.onClick(row);
            };

            actionsContainer.appendChild(btn);
          });

          td.appendChild(actionsContainer);
          tr.appendChild(td);
        }
      }

      tbody.appendChild(tr);
    });

    if (paginatedData.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = options.columns.length + (options.actions ? 1 : 0);
      td.style.cssText = "padding: 40px; text-align: center; color: var(--ic-mutedText, #a7b0b7);";
      td.textContent = "Aucune donnée à afficher";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  };

  // Header
  const headerRow = document.createElement("tr");
  options.columns.forEach((col) => {
    const th = document.createElement("th");
    th.style.cssText = `
      padding: 12px 16px;
      text-align: left;
      color: var(--ic-mutedText, #a7b0b7);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    `;
    if (col.width) th.style.width = col.width;

    const headerContent = document.createElement("div");
    headerContent.style.cssText = "display: flex; align-items: center; gap: 8px;";

    const label = document.createElement("span");
    label.textContent = col.label;

    if ((options.sortable !== false && col.sortable !== false) || col.sortable) {
      label.style.cursor = "pointer";
      label.onclick = () => {
        if (sortedColumn?.key === col.key) {
          sortedColumn.direction = sortedColumn.direction === "asc" ? "desc" : "asc";
        } else {
          sortedColumn = { key: col.key, direction: "asc" };
        }

        filteredData.sort((a, b) => {
          const aVal = a[col.key as keyof T];
          const bVal = b[col.key as keyof T];
          const comparison = String(aVal || "").localeCompare(String(bVal || ""));
          return sortedColumn!.direction === "asc" ? comparison : -comparison;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
      };
    }

    headerContent.appendChild(label);
    if (sortedColumn?.key === col.key) {
      const sortIcon = document.createElement("span");
      sortIcon.textContent = sortedColumn.direction === "asc" ? "↑" : "↓";
      sortIcon.style.cssText = "font-size: 12px; color: var(--ic-accent, #7b2cff);";
      headerContent.appendChild(sortIcon);
    }

    th.appendChild(headerContent);
    headerRow.appendChild(th);
  });

  if (options.actions) {
    const th = document.createElement("th");
    th.style.cssText = "padding: 12px 16px; text-align: left; color: var(--ic-mutedText, #a7b0b7); font-weight: 600; font-size: 12px;";
    th.textContent = "Actions";
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrapper.appendChild(table);

  // Pagination
  const paginationContainer = document.createElement("div");
  const renderPagination = () => {
    if (options.pagination === false) {
      paginationContainer.style.display = "none";
      return;
    }

    paginationContainer.innerHTML = "";
    paginationContainer.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 12px 0;";

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, filteredData.length);

    const info = document.createElement("div");
    info.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 13px;";
    info.textContent = `Affichage de ${startIndex} à ${endIndex} sur ${filteredData.length} résultats`;
    paginationContainer.appendChild(info);

    const controls = document.createElement("div");
    controls.style.cssText = "display: flex; gap: 8px; align-items: center;";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Précédent";
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.cssText = `
      padding: 6px 12px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: ${currentPage === 1 ? "transparent" : "var(--ic-panel, #1a1d1f)"};
      color: ${currentPage === 1 ? "var(--ic-mutedText, #a7b0b7)" : "var(--ic-text, #e7ecef)"};
      cursor: ${currentPage === 1 ? "not-allowed" : "pointer"};
      font-size: 12px;
    `;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
        renderPagination();
      }
    };

    const pageInput = document.createElement("input");
    pageInput.type = "number";
    pageInput.value = String(currentPage);
    pageInput.min = "1";
    pageInput.max = String(totalPages);
    pageInput.style.cssText = `
      width: 60px;
      padding: 6px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      text-align: center;
      font-size: 12px;
    `;
    pageInput.onchange = (e) => {
      const page = parseInt((e.target as HTMLInputElement).value);
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTable();
        renderPagination();
      }
    };

    const totalPagesSpan = document.createElement("span");
    totalPagesSpan.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 12px;";
    totalPagesSpan.textContent = `sur ${totalPages}`;

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Suivant";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.style.cssText = `
      padding: 6px 12px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: ${currentPage === totalPages ? "transparent" : "var(--ic-panel, #1a1d1f)"};
      color: ${currentPage === totalPages ? "var(--ic-mutedText, #a7b0b7)" : "var(--ic-text, #e7ecef)"};
      cursor: ${currentPage === totalPages ? "not-allowed" : "pointer"};
      font-size: 12px;
    `;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        renderPagination();
      }
    };

    controls.appendChild(prevBtn);
    controls.appendChild(pageInput);
    controls.appendChild(totalPagesSpan);
    controls.appendChild(nextBtn);
    paginationContainer.appendChild(controls);
  };

  container.appendChild(tableWrapper);
  container.appendChild(paginationContainer);

  // Initial render
  renderTable();
  renderPagination();

  return container;
}
