import { renderReactPage } from "../_shared/renderReactPage";

function AccountApp() {
  return (
    <div className="page-container">
      <h1>APP / ACCOUNT</h1>
      <p>Surface baseline.</p>
    </div>
  );
}

export function renderAccountApp(root: HTMLElement): void {
  renderReactPage(root, AccountApp);
}

export default AccountApp;
