/**
 * ICONTROL_TOOLBAR_V1
 * Toolbar standardisée avec recherche, filtres et actions
 */
export interface ToolbarFilter {
  label: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  value?: string;
}

export interface ToolbarAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
  icon?: string;
}

export interface ToolbarOptions {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filters?: ToolbarFilter[];
  actions?: ToolbarAction[];
}

export function createToolbar(options: ToolbarOptions): {
  element: HTMLElement;
  searchInput?: HTMLInputElement;
} {
  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 12px;
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 10px;
    background: var(--ic-panel, #1a1d1f);
  `;

  let searchInput: HTMLInputElement | undefined;
  if (options.onSearch) {
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = options.searchPlaceholder || "Rechercher...";
    searchInput.style.cssText = `
      flex: 1;
      min-width: 220px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      background: #121516;
      color: var(--ic-text, #e7ecef);
      font-size: 12px;
    `;
    searchInput.addEventListener("input", () => {
      options.onSearch?.(searchInput?.value || "");
    });
    container.appendChild(searchInput);
  }

  (options.filters || []).forEach((filter) => {
    const label = document.createElement("label");
    label.style.cssText = "display:flex; align-items:center; gap:8px; color: var(--ic-mutedText, #a7b0b7); font-size: 11px;";
    label.textContent = `${filter.label}:`;
    const select = document.createElement("select");
    select.style.cssText = `
      padding: 6px 10px;
      background: #121516;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 8px;
      color: var(--ic-text, #e7ecef);
      font-size: 12px;
      cursor: pointer;
    `;
    select.innerHTML = filter.options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("");
    if (filter.value) {
      select.value = filter.value;
    }
    select.addEventListener("change", () => {
      filter.onChange(select.value);
    });
    label.appendChild(select);
    container.appendChild(label);
  });

  if (options.actions && options.actions.length > 0) {
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:8px; margin-left:auto; flex-wrap:wrap;";
    options.actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action.icon ? `${action.icon} ${action.label}` : action.label;
      btn.style.cssText = `
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid ${action.primary ? "var(--ic-accent, #7b2cff)" : "var(--ic-border, #2b3136)"};
        background: ${action.primary ? "var(--ic-accent, #7b2cff)" : "transparent"};
        color: ${action.primary ? "white" : "var(--ic-text, #e7ecef)"};
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
      `;
      btn.onclick = action.onClick;
      actions.appendChild(btn);
    });
    container.appendChild(actions);
  }

  return { element: container, searchInput };
}
