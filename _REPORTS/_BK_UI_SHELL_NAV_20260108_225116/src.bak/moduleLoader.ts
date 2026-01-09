import type { RouteId } from "./router";

// Import module pages (single source of truth)
import { renderLogin } from "../../modules/core-system/ui/frontend-ts/pages/login";
import { renderDashboard } from "../../modules/core-system/ui/frontend-ts/pages/dashboard";
import { renderSettingsPage } from "../../modules/core-system/ui/frontend-ts/pages/settings";
import { renderBrandingSettings } from "../../modules/core-system/ui/frontend-ts/pages/settings/branding";

export function renderRoute(rid: RouteId, root: HTMLElement): void {
  if (rid === "login") return renderLogin(root);
  if (rid === "dashboard") return renderDashboard(root);
  if (rid === "settings") return renderSettingsPage(root);
  if (rid === "settings_branding") return renderBrandingSettings(root);

  root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page introuvable.</div>`;
}
