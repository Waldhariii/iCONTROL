import { renderReactPage } from "../_shared/renderReactPage";

function HomeApp() {
  return (
    <div className="page-container">
      <h1>APP / HOME</h1>
      <p>Bienvenue dans l'application client iCONTROL.</p>
      <ul>
        <li><a href="#/pages-inventory">Pages Inventory</a></li>
        <li><a href="#/__ui-catalog-client">UI Catalog (Client)</a></li>
        <li><a href="#/access-denied">Access Denied</a></li>
      </ul>
    </div>
  );
}

export function renderHomeApp(root: HTMLElement): void {
  renderReactPage(root, HomeApp);
}

export default HomeApp;
