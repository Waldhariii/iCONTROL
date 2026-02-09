import { useTenantContext } from '@/core/tenant/tenantContext';

/**
 * ICONTROL_APP_HOME_V1
 * Landing page for APP (Client Application)
 * Distinct from CP home - no shared components
 */
import { coreBaseStyles } from "../../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { navigate } from "/src/router";

export function renderHomeApp(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Application Client",
    subtitle: "Bienvenue dans l'application client iCONTROL",
    safeMode: "OFF",
    statusBadge: { label: "APP", tone: "info" }
  });

  const { card, body } = createSectionCard({
    title: "Accueil",
    description: "Page d'accueil de l'application client"
  });

  const welcome = document.createElement("div");
  welcome.style.padding = "24px";
  welcome.innerHTML = `
    <h2 style="margin:0 0 16px 0;font-size:24px;font-weight:600;">Bienvenue</h2>
    <p style="margin:0 0 24px 0;opacity:0.9;line-height:1.6;">
      Vous êtes sur l'application client iCONTROL.
    </p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <button id="btn-pages-inventory" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
        Pages Inventory
      </button>
      <button id="btn-client-catalog" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
        Client Catalog
      </button>
    </div>
  `;
  body.appendChild(welcome);

  const btnInventory = welcome.querySelector("#btn-pages-inventory");
  if (btnInventory) {
    btnInventory.addEventListener("click", () => navigate("#/pages-inventory"));
  }

  const btnCatalog = welcome.querySelector("#btn-client-catalog");
  if (btnCatalog) {
    btnCatalog.addEventListener("click", () => navigate("#/__ui-catalog-client"));
  }

  content.appendChild(card);
  root.appendChild(shell);
}
