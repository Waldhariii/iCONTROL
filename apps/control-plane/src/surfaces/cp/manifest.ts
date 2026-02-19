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
      { tenantId: "default", tenantName: "Default Tenant", children: React.createElement(Page) },
    ),
  );
}

function setError(root: HTMLElement, message: string) {
  root.innerHTML = `<div class="error-state">${message}</div>`;
}

/** Registry dérivé du catalogue CP : route_id → loader (root) => Promise<void>. Aucun switch explicite. */
const CP_PAGE_REGISTRY: Record<string, (root: HTMLElement) => Promise<void>> = {
  dashboard_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./dashboard/Page");
      if (typeof module.renderDashboard === "function") await module.renderDashboard(root);
      else setError(root, "Error loading page");
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Dashboard render failed:", err);
    }
  },
  login_cp: async (root) => {
    try {
      const module = await import("./login/Page");
      await renderReactPage(root, module.CpLoginPage);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load login page:", err);
    }
  },
  login_theme_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./login-theme/Page");
      await renderReactPage(root, module.default);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load login-theme page:", err);
    }
  },
  account_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./account/Page");
      await renderReactPage(root, module.CpAccountPage);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load account page:", err);
    }
  },
  settings_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./settings/Page");
      await renderReactPage(root, module.CpSettingsPage);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load settings page:", err);
    }
  },
  payment_settings_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const { PaymentSettingsSurface } = await import("./payment-settings/adapter");
      PaymentSettingsSurface.render(root);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load payment-settings page:", err);
    }
  },
  tenants_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./tenants/Page");
      await renderReactPage(root, module.default);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load tenants page:", err);
    }
  },
  users_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./users/Page");
      if (typeof module.renderUsersCp === "function") module.renderUsersCp(root);
      else setError(root, "Error loading page");
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load users page:", err);
    }
  },
  security_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./security/Page");
      await renderReactPage(root, module.default);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load security page:", err);
    }
  },
  policies_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./policies/Page");
      await renderReactPage(root, module.default);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load policies page:", err);
    }
  },
  providers_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./providers/Page");
      await renderReactPage(root, module.default);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load providers page:", err);
    }
  },
  entitlements_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./entitlements/Page");
      await renderReactPage(root, module.default);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load entitlements page:", err);
    }
  },
  pages_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./pages/Page");
      module.renderPages(root);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load pages page:", err);
    }
  },
  audit_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./audit/Page");
      if (typeof module.renderAudit === "function") module.renderAudit(root);
      else setError(root, "Error loading audit page");
    } catch (err) {
      setError(root, "Error loading audit page");
      console.error("Failed to load audit page:", err);
    }
  },
  subscriptions_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const { SubscriptionsSurface } = await import("./subscriptions/adapter");
      SubscriptionsSurface.render(root);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load subscriptions page:", err);
    }
  },
  observability_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const { ObservabilitySurface } = await import("./observability/adapter");
      ObservabilitySurface.render(root);
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load observability page:", err);
    }
  },
  notfound_cp: async (root) => {
    root.innerHTML = '<div class="loading-state">Chargement...</div>';
    try {
      const module = await import("./notfound/Page");
      if (typeof module.renderNotFoundCp === "function") module.renderNotFoundCp(root);
      else setError(root, "Error loading page");
    } catch (err) {
      setError(root, "Error loading page");
      console.error("Failed to load notfound page:", err);
    }
  },
};

export async function renderCpPage(rid: RouteId, root: HTMLElement): Promise<void> {
  const loader = CP_PAGE_REGISTRY[rid];
  if (!loader) {
    root.innerHTML = '<div class="page-not-found">Page not implemented</div>';
    return;
  }
  await loader(root);
}
