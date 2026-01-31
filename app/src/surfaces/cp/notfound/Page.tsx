import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createGovernanceFooter, mapSafeMode } from "./_shared/cpLayout";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

export function renderNotFoundCp(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Page introuvable",
    subtitle: "Route non reconnue dans le Control Plane",
    safeMode: safeModeValue,
    statusBadge: { label: "NOT FOUND", tone: "neutral" }
  });

  const { card, body } = createSectionCard({
    title: "Route inconnue",
    description: "Consultez la registry CP"
  });
  body.appendChild(createEmptyStateCard({
    title: "Page introuvable",
    message: "Cette route n'existe pas dans le Control Plane."
  }));
  content.appendChild(card);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
