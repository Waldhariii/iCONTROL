/**
 * ICONTROL_DATA_TABLE_V1
 * Table de données avec tri, pagination et recherche
 */

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => HTMLElement | string;
  width?: string;
}

export interface DataTableOptions<T = unknown> {
  columns: TableColumn<T>[];
  data: T[];
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => Array<{ label: string; onClick: () => void }>;
}

export function createDataTable<T extends Record<string, unknown>>(
  options: DataTableOptions<T>
): HTMLElement {
  const {
    columns,
    data,
    searchable = false,
    sortable = true,
    pagination = false,
    pageSize = 10,
    onRowClick,
    actions,
  } = options;

  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 16px;
  `;

  // Search bar
  let searchInput: HTMLInputElement | null = null;
  if (searchable) {
    const searchContainer = document.createElement("div");
    searchContainer.style.cssText = "position: relative;";
    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Rechercher...";
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-bg, #1a1d21);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
    `;
    searchContainer.appendChild(searchInput);
    container.appendChild(searchContainer);
  }

  // Table
  const tableWrapper = document.createElement("div");
  tableWrapper.style.cssText = `
    overflow-x: auto;
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
  `;

  const table = document.createElement("table");
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    background: var(--ic-bg, #1a1d21);
  `;

  // Header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.style.cssText = "border-bottom: 1px solid var(--ic-border, #2b3136);";

  let currentSort: { key: string; direction: "asc" | "desc" } | null = null;
  let filteredData = [...data];
  let currentPage = 1;

  columns.forEach((col) => {
    const th = document.createElement("th");
    th.style.cssText = `
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: var(--ic-mutedText, #a7b0b7);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      ${col.width ? `width: ${col.width};` : ""}
    `;

    if (sortable && col.sortable !== false) {
      th.style.cursor = "pointer";
      th.style.userSelect = "none";
      th.textContent = col.label + " ↕";
      th.onclick = () => {
        if (currentSort?.key === col.key) {
          currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
        } else {
          currentSort = { key: col.key, direction: "asc" };
        }
        renderTable();
      };
    } else {
      th.textContent = col.label;
    }
    headerRow.appendChild(th);
  });

  if (actions) {
    const actionsTh = document.createElement("th");
    actionsTh.style.cssText = `
      padding: 12px;
      text-align: right;
      font-size: 12px;
      font-weight: 600;
      color: var(--ic-mutedText, #a7b0b7);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: 100px;
    `;
    actionsTh.textContent = "Actions";
    headerRow.appendChild(actionsTh);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");

  function renderTable(): void {
    tbody.innerHTML = "";

    // Filter
    let displayData = [...data];
    if (searchInput && searchInput.value.trim()) {
      const query = searchInput.value.toLowerCase();
      displayData = displayData.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (currentSort) {
      displayData.sort((a, b) => {
        const aVal = a[currentSort!.key];
        const bVal = b[currentSort!.key];
        const comparison = String(aVal || "").localeCompare(String(bVal || ""));
        return currentSort!.direction === "asc" ? comparison : -comparison;
      });
    }

    filteredData = displayData;

    // Paginate
    let paginatedData = filteredData;
    if (pagination) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      paginatedData = filteredData.slice(start, end);
    }

    // Render rows
    paginatedData.forEach((row) => {
      const tr = document.createElement("tr");
      tr.style.cssText = `
        border-bottom: 1px solid var(--ic-border, #2b3136);
        transition: background 0.2s;
      `;

      if (onRowClick) {
        tr.style.cursor = "pointer";
        tr.onclick = () => onRowClick(row);
        tr.onmouseenter = () => {
          tr.style.background = "var(--ic-bgHover, rgba(255,255,255,0.05))";
        };
        tr.onmouseleave = () => {
          tr.style.background = "transparent";
        };
      }

      columns.forEach((col) => {
        const td = document.createElement("td");
        td.style.cssText = `
          padding: 12px;
          font-size: 13px;
          color: var(--ic-text, #e7ecef);
        `;

        const value = row[col.key];
        if (col.render) {
          const rendered = col.render(value, row);
          if (rendered instanceof HTMLElement) {
            td.appendChild(rendered);
          } else {
            td.textContent = String(rendered);
          }
        } else {
          td.textContent = value != null ? String(value) : "";
        }
        tr.appendChild(td);
      });

      if (actions) {
        const actionsTd = document.createElement("td");
        actionsTd.style.cssText = `
          padding: 12px;
          text-align: right;
        `;

        const actionButtons = actions(row);
        actionButtons.forEach((action) => {
          const btn = document.createElement("button");
          btn.textContent = action.label;
          btn.style.cssText = `
            padding: 4px 8px;
            margin-left: 4px;
            border: 1px solid var(--ic-border, #2b3136);
            border-radius: 4px;
            background: transparent;
            color: var(--ic-text, #e7ecef);
            font-size: 12px;
            cursor: pointer;
          `;
          btn.onclick = (e) => {
            e.stopPropagation();
            action.onClick();
          };
          actionsTd.appendChild(btn);
        });

        tr.appendChild(actionsTd);
      }

      tbody.appendChild(tr);
    });

    // Update pagination
    if (pagination) {
      updatePagination();
    }
  }

  // Pagination
  let paginationContainer: HTMLElement | null = null;

  function updatePagination(): void {
    if (!pagination) return;

    if (!paginationContainer) {
      paginationContainer = document.createElement("div");
      paginationContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-top: 1px solid var(--ic-border, #2b3136);
      `;
      container.appendChild(paginationContainer);
    }

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filteredData.length);

    paginationContainer.innerHTML = `
      <div style="font-size: 12px; color: var(--ic-mutedText, #a7b0b7);">
        ${start}-${end} sur ${filteredData.length}
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="prev-page" style="
          padding: 4px 8px;
          border: 1px solid var(--ic-border, #2b3136);
          border-radius: 4px;
          background: ${currentPage > 1 ? "var(--ic-primary, #4a9eff)" : "transparent"};
          color: ${currentPage > 1 ? "white" : "var(--ic-mutedText, #a7b0b7)"};
          font-size: 12px;
          cursor: ${currentPage > 1 ? "pointer" : "not-allowed"};
        ">Précédent</button>
        <span style="font-size: 12px; color: var(--ic-text, #e7ecef); padding: 4px 8px;">
          Page ${currentPage} / ${totalPages || 1}
        </span>
        <button id="next-page" style="
          padding: 4px 8px;
          border: 1px solid var(--ic-border, #2b3136);
          border-radius: 4px;
          background: ${currentPage < totalPages ? "var(--ic-primary, #4a9eff)" : "transparent"};
          color: ${currentPage < totalPages ? "white" : "var(--ic-mutedText, #a7b0b7)"};
          font-size: 12px;
          cursor: ${currentPage < totalPages ? "pointer" : "not-allowed"};
        ">Suivant</button>
      </div>
    `;

    const prevBtn = paginationContainer.querySelector("#prev-page") as HTMLButtonElement;
    const nextBtn = paginationContainer.querySelector("#next-page") as HTMLButtonElement;

    if (prevBtn && currentPage > 1) {
      prevBtn.onclick = () => {
        currentPage--;
        renderTable();
      };
    }

    if (nextBtn && currentPage < totalPages) {
      nextBtn.onclick = () => {
        currentPage++;
        renderTable();
      };
    }
  }

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);

  // Search handler
  if (searchInput) {
    searchInput.oninput = () => {
      currentPage = 1;
      renderTable();
    };
  }

  // Initial render
  renderTable();

  return container;
}
