import type { RouteId } from "../../router";
import type { ComponentType } from "react";
import { TenantProvider } from "@/core/tenant/tenantContext";
import { PaymentSettingsSurface } from "./payment-settings/adapter";

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
      { tenantId: "default", tenantName: "Default Tenant", children: React.createElement(Page) },
    ),
  );
}

export async function renderCpPage(rid: RouteId, root: HTMLElement): Promise<void> {
  if (rid === "dashboard_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./dashboard/Page");
      if (typeof module.renderDashboard !== "function") {
        root.innerHTML = '<div class="error-state">Error loading page</div>';
        return;
      }
      try {
        module.renderDashboard(root);
      } catch (err) {
        root.innerHTML = '<div class="error-state">Error loading page</div>';
        console.error("Dashboard render failed:", err);
      }
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load dashboard page:", err);
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

  if (rid === "settings_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./settings/Page");
      const Page = module.CpSettingsPage;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load settings page:", err);
    }
    return;
  }

  if (rid === "pages_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./pages/Page");
      module.renderPages(root);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load pages page:", err);
    }
    return;
  }

  if (rid === "tenants_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./tenants/Page");
      const Page = module.default;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load tenants page:", err);
    }
    return;
  }

  if (rid === "security_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./security/Page");
      const Page = module.default;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load security page:", err);
    }
    return;
  }

  if (rid === "policies_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./policies/Page");
      const Page = module.default;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load policies page:", err);
    }
    return;
  }

  if (rid === "providers_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./providers/Page");
      const Page = module.default;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load providers page:", err);
    }
    return;
  }

  if (rid === "entitlements_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./entitlements/Page");
      const Page = module.default;
      await renderReactPage(root, Page);
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load entitlements page:", err);
    }
    return;
  }

  if (rid === "audit_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./audit/Page");
      if (typeof module.renderAudit === "function") {
        module.renderAudit(root);
        return;
      }
      root.innerHTML = '<div class="error-state">Error loading audit page</div>';
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading audit page</div>';
      console.error("Failed to load audit page:", err);
    }
    return;
  }

  if (rid === "notfound_cp") {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./notfound/Page");
      if (typeof module.renderNotFoundCp === "function") {
        module.renderNotFoundCp(root);
        return;
      }
      root.innerHTML = '<div class="error-state">Error loading page</div>';
    } catch (err) {
      root.innerHTML = '<div class="error-state">Error loading page</div>';
      console.error("Failed to load notfound page:", err);
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
