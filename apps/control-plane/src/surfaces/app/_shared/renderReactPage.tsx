import React from "react";
import ReactDOM from "react-dom/client";
import { TenantProvider } from "@/core/tenant/tenantContext";

export function renderReactPage(root: HTMLElement, Page: React.ComponentType): void {
  root.innerHTML = "";
  const container = document.createElement("div");
  container.id = "app-surface-root";
  root.appendChild(container);

  const reactRoot = ReactDOM.createRoot(container);
  reactRoot.render(
    <TenantProvider tenantId="default" tenantName="Default Tenant">
      <Page />
    </TenantProvider>
  );
}
