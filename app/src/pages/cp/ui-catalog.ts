import { renderCatalog } from "../../core/ui/catalog";

export function renderUiCatalog(root: HTMLElement): void {
  if (!import.meta.env.DEV) {
    root.innerHTML =
      "<div class='ic-cp-03be181d68'>UI Catalog is available in DEV only.</div>";
    return;
  }
  renderCatalog(root, "cp");
}
