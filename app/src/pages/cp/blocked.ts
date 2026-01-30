import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createEmptyStateCard } from "/src/core/ui/emptyState";
import { createGovernanceFooter, mapSafeMode } from "./_shared/cpLayout";
import { getSafeMode } from "../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

export function renderBlockedCp(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Version bloquée",
    subtitle: "Politique de version / contrôle de conformité",
    safeMode: safeModeValue,
    statusBadge: { label: "BLOCKED", tone: "err" }
  });

  const { card, body } = createSectionCard({
    title: "Accès bloqué",
    description: "Mise à jour requise"
  });
  body.appendChild(createEmptyStateCard({
    title: "Version non conforme",
    message: "Cette version est bloquée par une politique de conformité. Consultez l'audit."
  }));
  content.appendChild(card);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
