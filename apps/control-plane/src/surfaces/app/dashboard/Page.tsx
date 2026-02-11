import { renderReactPage } from "../_shared/renderReactPage";

function DashboardApp() {
  return (
    <div className="page-container">
      <h1>APP / DASHBOARD</h1>
      <p>Page métier MVP (governed).</p>
    </div>
  );
}

export function renderDashboardApp(root: HTMLElement): void {
  renderReactPage(root, DashboardApp);
}

export default DashboardApp;
