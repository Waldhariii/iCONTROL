/**
 * ICONTROL_CP_SETTINGS_BRANDING_V1
 * Branding settings page for Control Plane
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createBadge } from "/src/core/ui/badge";
import { createGovernanceFooter, createTwoColumnLayout, mapSafeMode } from "./_shared/cpLayout";
import { navigate } from "/src/router";

export function renderSettingsBranding(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Branding",
    subtitle: "Personnalisation de l'apparence et de l'identité visuelle",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const grid = createTwoColumnLayout();
  content.appendChild(grid);

  // Section Couleurs
  const { card: colorsCard, body: colorsBody } = createSectionCard({
    title: "Couleurs",
    description: "Configuration de la palette de couleurs"
  });
  
  const colorsInfo = document.createElement("div");
  colorsInfo.classList.add("ic-inline");
  colorsInfo.textContent = "Les couleurs sont gérées via les design tokens. Utilisez les variables CSS pour personnaliser.";
  colorsBody.appendChild(colorsInfo);
  grid.appendChild(colorsCard);

  // Section Logo
  const { card: logoCard, body: logoBody } = createSectionCard({
    title: "Logo",
    description: "Configuration du logo de l'application"
  });
  
  const logoInfo = document.createElement("div");
  logoInfo.classList.add("ic-inline");
  logoInfo.textContent = "Le logo est configuré via le service de branding. Consultez la documentation pour plus de détails.";
  logoBody.appendChild(logoInfo);
  grid.appendChild(logoCard);

  // Bouton retour
  const backLink = document.createElement("a");
  backLink.href = "#/settings";
  backLink.classList.add("ic-inline");
  backLink.textContent = "← Retour aux paramètres";
  backLink.onclick = (e) => {
    e.preventDefault();
    navigate("#/settings");
  };
  content.appendChild(backLink);

  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
