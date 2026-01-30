/**
 * ICONTROL_TOOLBAR_V1
 * Toolbar standardisée avec recherche, filtres et actions
 */
import { createButton } from "./button";
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
  actionId?: string;
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
  container.className = "ic-toolbar";

  let searchInput: HTMLInputElement | undefined;
  if (options.onSearch) {
    searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = options.searchPlaceholder || "Rechercher...";
    searchInput.className = "ic-toolbar__search";
    searchInput.addEventListener("input", () => {
      options.onSearch?.(searchInput?.value || "");
    });
    container.appendChild(searchInput);
  }

  (options.filters || []).forEach((filter) => {
    const label = document.createElement("label");
    label.className = "ic-toolbar__filter";
    label.textContent = `${filter.label}:`;
    const select = document.createElement("select");
    select.className = "ic-toolbar__select";
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
    actions.className = "ic-toolbar__actions";
    options.actions.forEach((action) => {
      const btn = createButton({
        label: action.label,
        variant: action.primary ? "primary" : "secondary",
        size: "small",
        icon: action.icon,
        onClick: () => action.onClick()
      });
      if (action.actionId) btn.setAttribute("data-action-id", action.actionId);
      actions.appendChild(btn);
    });
    container.appendChild(actions);
  }

  return { element: container, searchInput };
}
