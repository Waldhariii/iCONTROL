import { renderReactPage } from "../_shared/renderReactPage";

function GalleryApp() {
  return (
    <div className="page-container">
      <h1>APP / GALLERY</h1>
      <p>Vue de navigation rapide (stub).</p>
      <ul>
        <li><a href="#/login">Login</a></li>
        <li><a href="#/dashboard">Dashboard</a></li>
        <li><a href="#/clients">Clients</a></li>
        <li><a href="#/jobs">Jobs</a></li>
      </ul>
    </div>
  );
}

export function renderGalleryApp(root: HTMLElement): void {
  renderReactPage(root, GalleryApp);
}

export default GalleryApp;
