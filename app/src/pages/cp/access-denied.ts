import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createGovernanceFooter, mapSafeMode } from "./_shared/cpLayout";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

export function renderAccessDeniedCp(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Accès refusé",
    subtitle: "Entitlement requis pour cette page",
    safeMode: safeModeValue,
    statusBadge: { label: "ACCÈS REQUIS", tone: "warn" }
  });

  const { card, body } = createSectionCard({
    title: "Entitlement requis",
    description: "Accès gouverné"
  });
  body.appendChild(createEmptyStateCard({
    title: "Entitlement requis",
    message: "Cette page nécessite une autorisation gouvernée. Consultez l'audit pour plus de détails."
  }));
  content.appendChild(card);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
