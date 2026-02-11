import { renderReactPage } from "../_shared/renderReactPage";

function ClientsApp() {
  return (
    <div className="page-container">
      <h1>APP / CLIENTS</h1>
      <p>Surface métier (stub).</p>
    </div>
  );
}

export function renderClientsApp(root: HTMLElement): void {
  renderReactPage(root, ClientsApp);
}

export default ClientsApp;
