import type { RouteId } from "../../router";

export async function renderCpPage(rid: RouteId, root: HTMLElement): Promise<void> {
  if (rid === "dynamic_test_cp") {
    try {
      const module = await import("./dynamic-test/Page");
      const Page = module.default;
      
      root.innerHTML = "";
      const container = document.createElement("div");
      container.id = "dynamic-test-root";
      root.appendChild(container);
      
      const React = await import("react");
      const ReactDOM = await import("react-dom/client");
      
      const reactRoot = ReactDOM.createRoot(container);
      reactRoot.render(React.createElement(Page));
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load dynamic-test page:", err);
    }
  } else {
    root.innerHTML = '<div class="page-not-found">Page not implemented</div>';
  }
}
