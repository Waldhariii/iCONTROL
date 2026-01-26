/**
 * ICONTROL_CP_INTEGRATIONS_V1
 * Hub intégrations (visual-only). Complété pour permettre le build (registry).
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createGovernanceFooter, createTwoColumnLayout, mapSafeMode } from "./_shared/cpLayout";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

export function renderIntegrations(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Connexions",
    subtitle: "Intégrations et API",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const grid = createTwoColumnLayout();
  const { card, body } = createSectionCard({
    title: "Connexions",
    description: "Services externes et webhooks"
  });
  body.appendChild(createEmptyStateCard({
    title: "Aucune intégration",
    message: "Configurez des connexions depuis le hub ou l'API."
  }));
  grid.appendChild(card);
  content.appendChild(grid);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
