import { blockKeyValueTable } from "../../../shared/uiBlocks";
import { renderRecommendations } from "../../../shared/recommendations";
import { getRole, getSafeMode } from "../../../shared/recommendations.ctx";

export function renderDossiersRules(root: HTMLElement): void {
  root.appendChild(
    blockKeyValueTable({
      title: "Regles (RBAC/SAFE_MODE)",
      rows: [
        { key: "Roles", value: "SYSADMIN / DEVELOPER / ADMIN / USER" },
        { key: "Ecriture", value: "SYSADMIN/DEVELOPER/ADMIN seulement" },
        { key: "SAFE_MODE STRICT", value: "actions d'ecriture bloquees" },
        { key: "CLOSED", value: "edits bloques, actions masquees" },
        { key: "Workflow", value: "OPEN → IN_PROGRESS → WAITING → CLOSED" }
      ]
    })
  );
  renderRecommendations(root, {
    pageId: "dossiers",
    scopeId: "dossiers.rules",
    role: getRole(),
    safeMode: getSafeMode()
  });
}
