import type { RouteId } from "../../router";

export async function renderCpPage(rid: RouteId, root: HTMLElement): Promise<void> {
  // Pour l'instant, on gère juste dynamic_test_cp
  if (rid === "dynamic_test_cp") {
    try {
      const module = await import("./dynamic-test/SimplePage");
      const Page = module.default;
      
      root.innerHTML = "";
      const container = document.createElement("div");
      container.id = "dynamic-test-root";
      root.appendChild(container);
      
      // Import React
      const React = await import("react");
      const ReactDOM = await import("react-dom/client");
      
      const reactRoot = ReactDOM.createRoot(container);
      reactRoot.render(React.createElement(Page));
    } catch (err) {
      root.innerHTML = `<div style="padding: 2rem; color: #f85149;">Error loading page: ${err}</div>`;
    }
  } else {
    root.innerHTML = `<div style="padding: 2rem; color: #9198a1;">Page ${rid} not implemented in manifest</div>`;
  }
}
