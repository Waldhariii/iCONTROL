/**
 * ICONTROL_TABLE_SELECTION_V1
 * Gestion de sélection multiple pour tableaux avec actions en masse
 */

export interface BulkAction {
  label: string;
  icon?: string;
  onClick: (selectedIds: string[]) => void | Promise<void>;
  style?: "primary" | "danger" | "warning";
  confirm?: boolean;
  confirmMessage?: string;
}

export function addTableSelection<T extends { id: string }>(
  tableElement: HTMLElement,
  data: T[],
  actions: BulkAction[]
): {
  getSelected: () => string[];
  clearSelection: () => void;
  selectAll: () => void;
} {
  const selectedIds = new Set<string>();

  // Créer la barre d'actions en masse (cachée par défaut)
  const bulkActionBar = document.createElement("div");
  bulkActionBar.style.minWidth = "0";
  bulkActionBar.style.boxSizing = "border-box";
  bulkActionBar.style.cssText = `
    display: none;
    padding: 12px 16px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #3e3e3e);
    border-radius: 6px;
    margin-bottom: 12px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  `;

  const selectedCount = document.createElement("div");
  selectedCount.style.cssText = "color: var(--ic-text, #e7ecef); font-size: 13px; font-weight: 600;";
  bulkActionBar.appendChild(selectedCount);

  const actionsContainer = document.createElement("div");
  actionsContainer.style.cssText = "display: flex; gap: 8px; align-items: center;";
  bulkActionBar.appendChild(actionsContainer);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "✕";
  clearBtn.style.cssText = `
    padding: 6px 10px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  clearBtn.onclick = () => {
    selectedIds.clear();
    updateSelectionUI();
  };
  actionsContainer.appendChild(clearBtn);

  actions.forEach(action => {
    const btn = document.createElement("button");
    if (action.icon) {
      btn.innerHTML = `${action.icon} ${action.label}`;
    } else {
      btn.textContent = action.label;
    }

    const colors = {
      primary: { bg: "var(--ic-panel, #37373d)", hover: "#4a4a50" },
      danger: { bg: "rgba(244,135,113,0.2)", hover: "rgba(244,135,113,0.3)", color: "#f48771" },
      warning: { bg: "rgba(220,220,170,0.2)", hover: "rgba(220,220,170,0.3)", color: "#dcdcaa" }
    };

    const color = colors[action.style || "primary"];

    btn.style.cssText = `
      padding: 8px 16px;
      background: ${color.bg};
      border: 1px solid var(--ic-border, #2b3136);
      color: ${color.color || "var(--ic-text, #e7ecef)"};
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
    `;

    btn.onmouseenter = () => { btn.style.background = color.hover; };
    btn.onmouseleave = () => { btn.style.background = color.bg; };

    btn.onclick = async () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      if (action.confirm) {
        if (!confirm(action.confirmMessage || `Confirmer l'action "${action.label}" sur ${ids.length} élément(s) ?`)) {
          return;
        }
      }

      await action.onClick(ids);
      selectedIds.clear();
      updateSelectionUI();
    };

    actionsContainer.appendChild(btn);
  });

  // Insérer la barre avant le tableau
  tableElement.parentElement?.insertBefore(bulkActionBar, tableElement);

  // Ajouter checkbox "Sélectionner tout" dans le header du tableau
  const thead = tableElement.querySelector("thead");
  if (thead) {
    const firstRow = thead.querySelector("tr");
    if (firstRow) {
      const selectAllCell = document.createElement("th");
      selectAllCell.style.cssText = "width: 40px; padding: 8px; text-align: center;";
      const selectAllCheckbox = document.createElement("input");
      selectAllCheckbox.type = "checkbox";
      selectAllCheckbox.style.cssText = "cursor: pointer;";
      selectAllCheckbox.onchange = () => {
        if (selectAllCheckbox.checked) {
          data.forEach(item => selectedIds.add(item.id));
        } else {
          selectedIds.clear();
        }
        updateSelectionUI();
      };
      selectAllCell.appendChild(selectAllCheckbox);
      firstRow.insertBefore(selectAllCell, firstRow.firstChild);
    }
  }

  // Ajouter checkboxes dans chaque ligne
  const tbody = tableElement.querySelector("tbody");
  if (tbody) {
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row, index) => {
      const item = data[index];
      if (!item) return;

      const checkboxCell = document.createElement("td");
      checkboxCell.style.cssText = "width: 40px; padding: 8px; text-align: center;";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.id = item.id;
      checkbox.style.cssText = "cursor: pointer;";
      checkbox.onchange = () => {
        if (checkbox.checked) {
          selectedIds.add(item.id);
        } else {
          selectedIds.delete(item.id);
        }
        updateSelectionUI();
      };
      checkboxCell.appendChild(checkbox);
      row.insertBefore(checkboxCell, row.firstChild);
    });
  }

  const updateSelectionUI = () => {
    const count = selectedIds.size;
    selectedCount.textContent = `${count} élément(s) sélectionné(s)`;
    bulkActionBar.style.display = count > 0 ? "flex" : "none";

    // Mettre à jour les checkboxes
    tableElement.querySelectorAll<HTMLInputElement>("input[type='checkbox']").forEach(cb => {
      const id = cb.dataset.id;
      if (id) {
        cb.checked = selectedIds.has(id);
      } else {
        // Checkbox "select all"
        cb.checked = count === data.length && count > 0;
      }
    });
  };

  return {
    getSelected: () => Array.from(selectedIds),
    clearSelection: () => {
      selectedIds.clear();
      updateSelectionUI();
    },
    selectAll: () => {
      data.forEach(item => selectedIds.add(item.id));
      updateSelectionUI();
    }
  };
}
