import { renderReactPage } from "../_shared/renderReactPage";

function SettingsApp() {
  return (
    <div className="page-container">
      <h1>APP / SETTINGS</h1>
      <p>Surface baseline.</p>
    </div>
  );
}

export function renderSettingsApp(root: HTMLElement): void {
  renderReactPage(root, SettingsApp);
}

export default SettingsApp;
