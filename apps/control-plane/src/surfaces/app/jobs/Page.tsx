import { renderReactPage } from "../_shared/renderReactPage";

function JobsApp() {
  return (
    <div className="page-container">
      <h1>APP / JOBS</h1>
      <p>Surface métier (stub).</p>
    </div>
  );
}

export function renderJobsApp(root: HTMLElement): void {
  renderReactPage(root, JobsApp);
}

export default JobsApp;
