import { renderReactPage } from "../_shared/renderReactPage";

function ClientCatalogApp() {
  return (
    <div className="page-container">
      <h1>Client — Catalog UI</h1>
      <p>Page fictive de référence (sans data métier).</p>
    </div>
  );
}

export function renderClientCatalog(root: HTMLElement): void {
  renderReactPage(root, ClientCatalogApp);
}

export default ClientCatalogApp;
