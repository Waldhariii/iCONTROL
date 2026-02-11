import { renderReactPage } from "../_shared/renderReactPage";

function ClientDisabledApp() {
  return (
    <div className="page-container">
      <h1>Client désactivé</h1>
      <p>Surface Client en reconstruction — accès temporairement suspendu.</p>
    </div>
  );
}

export function renderClientDisabled(root: HTMLElement): void {
  renderReactPage(root, ClientDisabledApp);
}

export default ClientDisabledApp;
