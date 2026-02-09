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
  container.className = "ic-table";

  // Search bar
  let searchInput: HTMLInputElement | null = null;
  if (searchable) {
    const searchContainer = document.createElement("div");
    searchContainer.className = "ic-table__search";
    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Rechercher...";
    searchInput.className = "ic-table__search-input";
    searchContainer.appendChild(searchInput);
    container.appendChild(searchContainer);
  }

  // Table
  const tableWrapper = document.createElement("div");
  tableWrapper.className = "ic-table__wrap";

  const table = document.createElement("table");
  table.className = "ic-table__table";

  // Header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.className = "ic-table__row ic-table__row--head";

  const PAGE_SIZE_OPTS = [10, 25, 50];
  let currentPageSize = PAGE_SIZE_OPTS.includes(pageSize) ? pageSize : PAGE_SIZE_OPTS[0];
  let currentSort: { key: string; direction: "asc" | "desc" } | null = null;
  let filteredData = [...data];
  let currentPage = 1;

  columns.forEach((col) => {
    const th = document.createElement("th");
    th.className = "ic-table__th";
    if (col.width) th.style.width = col.width;

    if (sortable && col.sortable !== false) {
      th.classList.add("is-sortable");
      th.textContent = col.label + " ↕";
      th.onclick = () => {
        if (currentSort?.key === col.key) {
          currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
        } else {
          currentSort = { key: col.key, direction: "asc" };
        }
        columns.forEach((c, i) => {
          const h = headerRow.children[i] as HTMLElement;
          if (sortable && c.sortable !== false && h) {
            const icon = currentSort?.key === c.key
              ? (currentSort!.direction === "asc" ? " ▲" : " ▼")
              : " ↕";
            h.textContent = c.label + icon;
            if (currentSort?.key === c.key) {
              h.dataset["sortActive"] = "1";
            } else {
              delete h.dataset["sortActive"];
            }
          }
        });
        renderTable();
      };
    } else {
      th.textContent = col.label;
    }
    headerRow.appendChild(th);
  });

  if (actions) {
    const actionsTh = document.createElement("th");
    actionsTh.className = "ic-table__th ic-table__th--actions";
    actionsTh.textContent = "Actions";
    headerRow.appendChild(actionsTh);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement("tbody");

  function renderTable(): void {
  const pageSize = currentPageSize ?? 25;

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
      tr.className = "ic-table__row";

      if (onRowClick) tr.style.cursor = "pointer";
      if (onRowClick) tr.onclick = () => onRowClick(row);

      columns.forEach((col) => {
        const td = document.createElement("td");
        td.className = "ic-table__cell";

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
        actionsTd.className = "ic-table__cell ic-table__cell--actions";

        const actionButtons = actions(row);
        actionButtons.forEach((action) => {
          const btn = document.createElement("button");
          btn.textContent = action.label;
          btn.className = "ic-table__action-btn";
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
  const pageSize = currentPageSize ?? 25;

    if (!pagination) return;

    if (!paginationContainer) {
      paginationContainer = document.createElement("div");
      paginationContainer.className = "ic-table__pagination";
      container.appendChild(paginationContainer);
    }

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filteredData.length);

    paginationContainer.innerHTML = "";
    const left = document.createElement("div");
    left.className = "ic-table__pagination-info";
    const span = document.createElement("span");
    span.textContent = `${start}-${end} sur ${filteredData.length}`;
    left.appendChild(span);

    const pageSizeSel = document.createElement("select");
    pageSizeSel.className = "ic-table__select";
    pageSizeSel.setAttribute("aria-label", "Lignes par page");
    pageSizeSel.innerHTML = PAGE_SIZE_OPTS.map((n) => `<option value="${n}" ${n === pageSize ? "selected" : ""}>${n}</option>`).join("");
    pageSizeSel.onchange = () => {
      currentPageSize = parseInt(pageSizeSel.value, 10);
      currentPage = 1;
      renderTable();
    };
    left.appendChild(pageSizeSel);

    const right = document.createElement("div");
    right.className = "ic-table__pagination-actions";

    const prevBtn = document.createElement("button");
    prevBtn.className = "ic-table__page-btn";
    prevBtn.textContent = "Précédent";
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    };

    const pageInfo = document.createElement("span");
    pageInfo.className = "ic-table__page-info";
    pageInfo.textContent = `Page ${currentPage} / ${totalPages || 1}`;

    const nextBtn = document.createElement("button");
    nextBtn.className = "ic-table__page-btn";
    nextBtn.textContent = "Suivant";
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    };

    right.appendChild(prevBtn);
    right.appendChild(pageInfo);
    right.appendChild(nextBtn);

    paginationContainer.appendChild(left);
    paginationContainer.appendChild(right);
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
