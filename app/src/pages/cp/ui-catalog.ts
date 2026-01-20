import { renderCatalog } from "../../core/ui/catalog";

export function renderUiCatalog(root: HTMLElement): void {
  if (!import.meta.env.DEV) {
    root.innerHTML =
      "<div style='padding:16px;opacity:.8;'>UI Catalog is available in DEV only.</div>";
    return;
  }
  renderCatalog(root, "cp");
}
