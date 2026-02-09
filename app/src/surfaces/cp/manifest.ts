import type { RouteId } from "../../router";
import type { ComponentType } from "react";
import { TenantProvider } from "@/core/tenant/tenantContext";

async function renderReactPage(root: HTMLElement, Page: ComponentType) {
  root.innerHTML = "";
  const container = document.createElement("div");
  container.id = "cp-surface-root";
  root.appendChild(container);

  const React = await import("react");
  const ReactDOM = await import("react-dom/client");

  const reactRoot = ReactDOM.createRoot(container);
  reactRoot.render(
    React.createElement(
      TenantProvider,
      { tenantId: "default", tenantName: "Default Tenant" },
      React.createElement(Page),
    ),
  );
}

export async function renderCpPage(rid: RouteId, root: HTMLElement): Promise<void> {
  if (rid === "dynamic_test_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./dynamic-test/Page");
      const Page = module.default;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load dynamic-test page:", err);
    }
    return;
  }

  if (rid === "login_theme_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./login-theme/Page");
      const Page = module.default;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load login-theme page:", err);
    }
    return;
  }

  if (rid === "login_cp") {
    try {
      const module = await import("./login/Page");
      const Page = module.CpLoginPage;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load login page:", err);
    }
    return;
  } else {
    root.innerHTML = '<div class="page-not-found">Page not implemented</div>';
  }
}
