/**
 * ICONTROL_CP_SETTINGS_V1
 * Settings page for Control Plane (gouvernance, configuration)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { createGovernanceFooter, createTwoColumnLayout, mapSafeMode } from "./_shared/cpLayout";
import { navigate } from "/src/router";

export function renderSettings(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Paramètres",
    subtitle: "Configuration et gouvernance du système",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  // Section Branding
  const { card: brandingCard, body: brandingBody } = createSectionCard({
    title: "Branding",
    description: "Personnalisation de l'apparence"
  });
  
  const brandingLink = document.createElement("a");
  brandingLink.href = "#/settings/branding";
  brandingLink.classList.add("ic-inline");
  brandingLink.textContent = "Configurer le branding";
  brandingLink.onclick = (e) => {
    e.preventDefault();
    navigate("#/settings/branding");
  };
  brandingBody.appendChild(brandingLink);
  grid.appendChild(brandingCard);

  // Section Système
  const { card: systemCard, body: systemBody } = createSectionCard({
    title: "Système",
    description: "Configuration système et maintenance"
  });
  
  const systemLink = document.createElement("a");
  systemLink.href = "#/system";
  systemLink.classList.add("ic-inline");
  systemLink.textContent = "Voir le système";
  systemLink.onclick = (e) => {
    e.preventDefault();
    navigate("#/system");
  };
  systemBody.appendChild(systemLink);
  grid.appendChild(systemCard);

  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
