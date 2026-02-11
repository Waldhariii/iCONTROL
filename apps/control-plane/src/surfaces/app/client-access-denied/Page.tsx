import { renderReactPage } from "../_shared/renderReactPage";

function ClientAccessDeniedApp() {
  return (
    <div className="page-container">
      <h1>Accès refusé</h1>
      <p>La surface Client est verrouillée par la gouvernance.</p>
    </div>
  );
}

export function renderClientAccessDenied(root: HTMLElement): void {
  renderReactPage(root, ClientAccessDeniedApp);
}

export default ClientAccessDeniedApp;
